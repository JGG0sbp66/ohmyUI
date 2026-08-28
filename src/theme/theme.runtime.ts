import { inject, nextTick, watch, type InjectionKey } from "vue";

import { THEME_MODES, type ThemeMode } from "./theme.model";
import type { ThemeStore } from "./theme.store";

/*
 * Runtime 与 CSS 之间的约定：
 * - --app-hue 是根节点上的实时色相值；
 * - data-theme-committing 是切换模式时的临时锁，base.css 会在锁存在期间
 *   关闭组件自己的 transition，避免局部颜色动画和整页快照动画互相打架。
 */
const HUE_PROPERTY = "--app-hue";
const THEME_COMMIT_ATTRIBUTE = "data-theme-committing";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * 安全读取媒体查询。
 * Window 在 SSR、测试环境或特殊 WebView 中可能不存在，matchMedia 也可能抛错；
 * 这些情况只表示“不匹配”，不应该阻断主题初始化。
 */
function matchesMedia(view: Window | null, query: string): boolean {
  if (!view || typeof view.matchMedia !== "function") return false;

  try {
    return view.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/** 将外部输入限制在 CSS Hue 使用的 0～360 范围内。 */
function normalizeHue(value: number): number {
  return Math.min(360, Math.max(0, value));
}

/**
 * Hue 的 DOM 适配器。
 * 它只负责根节点 CSS 变量的读取和写入，不知道 Pinia，也不处理动画。
 */
class HueController {
  constructor(private readonly root: HTMLElement) {}

  read(): number {
    // 必须读取 computed style，而不是只读 root.style：默认值定义在 base.css 中。
    const style = this.root.ownerDocument.defaultView?.getComputedStyle(this.root);
    const raw = style?.getPropertyValue(HUE_PROPERTY).trim() ?? "";
    const parsed = Number(raw);

    /*
     * CSS 是默认 Hue 的唯一来源，所以这里不再提供 TypeScript fallback。
     * 缺少样式或值不合法时尽早报错，避免应用带着错误配置悄悄运行。
     */
    if (raw.length === 0 || !Number.isFinite(parsed) || parsed < 0 || parsed > 360) {
      throw new Error(
        'Expected "--app-hue" to be a number from 0 to 360. Import the ohmyUI styles before initializing ThemeRuntime.',
      );
    }

    return parsed;
  }

  write(angle: number): void {
    // 写成内联变量，使后续组件计算出的主题色立即使用最新 Hue。
    this.root.style.setProperty(HUE_PROPERTY, String(angle));
  }
}

/**
 * Mode 的 DOM 适配器。
 * 它保证 html 上始终只有一个有效模式 class，并负责从现有 DOM/系统偏好读取初值。
 */
class ModeController {
  constructor(
    private readonly root: HTMLElement,
    private readonly view: Window | null,
  ) {}

  read(): ThemeMode {
    // 服务端模板或提前执行的脚本可能已经写入模式 class，应优先尊重它。
    for (const mode of THEME_MODES) {
      if (this.root.classList.contains(mode)) return mode;
    }

    // 根节点没有显式模式时，才使用操作系统的深浅色偏好。
    return matchesMedia(this.view, DARK_MEDIA_QUERY) ? "dark" : "light";
  }

  /** 检查目标模式存在，并且其他模式 class 都不存在。 */
  isApplied(mode: ThemeMode): boolean {
    return THEME_MODES.every((candidate) =>
      candidate === mode
        ? this.root.classList.contains(candidate)
        : !this.root.classList.contains(candidate),
    );
  }

  write(mode: ThemeMode): void {
    // 先清理所有已知模式，再写入唯一目标，避免 light、dark 同时存在。
    this.root.classList.remove(...THEME_MODES);
    this.root.classList.add(mode);
  }
}

/**
 * 浏览器主题运行时。
 *
 * Pinia 只保存可观察状态；所有 DOM 写入、View Transition 生命周期和降级逻辑
 * 都收口在这里，避免 Store 同时承担状态仓库与浏览器服务两种职责。
 *
 * 建议按下面的顺序阅读：
 * 1. initialize()：从 CSS、DOM 和系统偏好建立初始状态；
 * 2. setHue()/setMode()：组件正常调用的两个公共入口；
 * 3. sync*()：把 Runtime 的请求送进 Pinia，再以 Pinia 最终值更新 DOM；
 * 4. reconcile*()：处理 DevTools、$patch 等绕过 Runtime 的直接 Store 修改。
 */
export class ThemeRuntime {
  private readonly root: HTMLElement;
  private readonly view: Window | null;
  private readonly hueController: HueController;
  private readonly modeController: ModeController;

  /** 当前仍在播放的根节点快照过渡；新请求到来时可以立即跳过它。 */
  private activeModeTransition: ViewTransition | undefined;

  /**
   * Mode 请求的递增版本号。
   * 每次新请求都会让旧 callback 失效，从而保证快速连点时“最后一次选择获胜”。
   */
  private modeRequestId = 0;

  /** 最新的用户意图；View Transition 尚未提交时，它可能暂时领先于 Store。 */
  private requestedMode: ThemeMode;

  /** 防止 initialize() 被重复调用并注册多组 watcher。 */
  private initialized = false;

  /**
   * 两个深度计数器是同步写入的重入锁。
   * Runtime 修改 Store 时会同步触发 watcher；计数器用于辨别“自己的写入”和
   * “外部直接写入”，避免 watcher 反过来重复执行相同同步流程。
   */
  private hueSyncDepth = 0;
  private modeSyncDepth = 0;

  constructor(
    private readonly store: ThemeStore,
    private readonly document: Document,
  ) {
    this.root = document.documentElement;
    this.view = document.defaultView;
    this.hueController = new HueController(this.root);
    this.modeController = new ModeController(this.root, this.view);
    this.requestedMode = store.mode;
  }

  /**
   * 在 Vue 挂载前完成一次性初始化。
   * 这样组件第一次渲染时，Pinia 状态与 html 上的 CSS 变量/class 已经一致，
   * 不会先渲染默认主题再闪到真实主题。
   */
  initialize(): void {
    if (this.initialized) return;

    // Hue 从 CSS 唯一默认值读取；Mode 从已有 class 或系统偏好读取。
    this.syncHueState(this.hueController.read());
    this.syncModeState(this.modeController.read());
    this.requestedMode = this.store.mode;

    /*
      Runtime API 是正常写入口；下面两个同步 watcher 是仓库兜底：DevTools、$patch
      或未来调用方直接改 Pinia 时，DOM 仍不会和状态分叉。直接改 mode 不补动画，
      因为状态已经发生，无法再可靠捕获旧快照，只做确定性的原子落位。

      flush: "sync" 很重要：Store 一变化就立刻收敛 DOM，不留下一帧不一致状态。
    */
    watch(
      () => this.store.hue,
      () => {
        if (this.hueSyncDepth > 0) return;
        this.reconcileHueFromStore();
      },
      { flush: "sync" },
    );

    watch(
      () => this.store.mode,
      () => {
        if (this.modeSyncDepth > 0) return;
        this.reconcileModeFromStore();
      },
      { flush: "sync" },
    );

    this.initialized = true;
  }

  /**
   * Hue 是连续值，拖动时需要逐帧立即响应。
   * 因此这里只同步状态和 CSS 变量，不使用 View Transition 做视觉补间。
   */
  setHue(value: number): void {
    if (!Number.isFinite(value)) return;
    this.syncHueState(normalizeHue(value));
  }

  /**
   * Mode 是离散操作：先保留旧快照，再原子提交新状态，由 root View Transition
   * 统一呈现主题变化。连续请求采用最后一次选择，旧过渡会被立即跳过。
   */
  async setMode(mode: ThemeMode): Promise<void> {
    // Store、最新请求和 DOM 都已处于目标模式时，无需再创建快照。
    if (
      mode === this.requestedMode &&
      mode === this.store.mode &&
      this.modeController.isApplied(mode)
    ) {
      return;
    }

    // 新编号会使尚未执行的旧 commitMode() 直接退出。
    this.requestedMode = mode;
    const requestId = ++this.modeRequestId;

    // 正在播放的旧快照不再代表最新选择，应立即退场。
    this.interruptModeTransition();

    // 可用于撤回尚未提交的请求，例如快速点击 dark 后立刻点回当前 light。
    if (mode === this.store.mode && this.modeController.isApplied(mode)) {
      this.releaseTransitionLock();
      return;
    }

    const startViewTransition = this.document.startViewTransition?.bind(this.document);
    const reduceMotion = matchesMedia(this.view, REDUCED_MOTION_QUERY);

    // 浏览器不支持 View Transition，或用户要求减少动态效果时，走无动画提交。
    if (!startViewTransition || reduceMotion) {
      await this.commitModeWithoutAnimation(mode, requestId);
      return;
    }

    let transition: ViewTransition;

    try {
      // 浏览器先截取旧页面，再在 callback 中提交新主题并截取新页面。
      transition = startViewTransition(() => this.commitMode(mode, requestId));
    } catch {
      // 某些浏览器环境即使暴露了 API 也可能启动失败，必须保证主题仍能切换。
      await this.commitModeWithoutAnimation(mode, requestId);
      return;
    }

    this.activeModeTransition = transition;

    try {
      /*
       * ready 表示新快照已经捕获、过渡即将播放。此时可以解除 transition 锁，
       * 因为后续用户看到的是两张根快照的动画，而不是实时 DOM 的局部追色。
       */
      await transition.ready;
    } catch {
      // skipTransition() 或浏览器无法建立快照时，update callback 仍可能正常完成。
      await transition.updateCallbackDone.catch(() => undefined);
    } finally {
      // 只能由最新请求释放锁，旧请求不能干扰后来的提交。
      if (requestId === this.modeRequestId) this.releaseTransitionLock();
    }

    // finished 只代表视觉动画结束，不影响模式是否已经提交。
    await transition.finished.catch(() => undefined);
    if (this.activeModeTransition === transition) this.activeModeTransition = undefined;
  }

  /** 在 View Transition 的 update callback 中原子提交新模式。 */
  private async commitMode(mode: ThemeMode, requestId: number): Promise<void> {
    // 过期请求不允许覆盖更新的用户选择。
    if (requestId !== this.modeRequestId) return;

    /*
     * 先加锁，再修改 Store 和根 class。base.css 会临时关闭所有局部 transition，
     * 确保浏览器捕获的是已经稳定的新主题，而不是各组件颜色变化到一半的状态。
     */
    this.root.setAttribute(THEME_COMMIT_ATTRIBUTE, "");
    this.syncModeState(mode);

    // 等所有依赖 mode 的 Vue DOM（包括控制器选中态）更新后再拍新快照。
    await nextTick();
  }

  /** 不创建快照，但仍沿用同一套原子提交和 transition 锁。 */
  private async commitModeWithoutAnimation(mode: ThemeMode, requestId: number): Promise<void> {
    try {
      await this.commitMode(mode, requestId);

      /*
       * 强制浏览器在移除锁之前完成一次样式计算，确保新的主题颜色是在
       * transition: none 的状态下落位，不会触发组件自己的颜色过渡。
       */
      if (requestId === this.modeRequestId) void this.root.offsetWidth;
    } finally {
      if (requestId === this.modeRequestId) this.releaseTransitionLock();
    }
  }

  /**
   * Store action 可能触发其他同步订阅者继续改值；返回后只认 Pinia 的最终值，
   * 再更新 CSS，避免依赖 watcher 注册顺序或中间值。
   */
  private syncHueState(hue: number): void {
    ++this.hueSyncDepth;
    try {
      this.store.syncHue(hue);
    } finally {
      --this.hueSyncDepth;

      // 最外层写入结束后统一收敛，嵌套写入只负责更新 Store。
      if (this.hueSyncDepth === 0) this.reconcileHueFromStore();
    }
  }

  /** 将 Pinia 中最终的 Hue 校验、规范化并写回根 CSS 变量。 */
  private reconcileHueFromStore(): void {
    const value = this.store.hue;

    // null 只表示 Runtime 尚未初始化；从 CSS 唯一默认值恢复即可。
    if (value === null) {
      this.syncHueState(this.hueController.read());
      return;
    }

    if (!Number.isFinite(value)) {
      throw new TypeError("Theme hue must be a finite number.");
    }

    // 外部可能通过 DevTools/$patch 写入越界值，先收敛回合法范围。
    const hue = normalizeHue(value);
    if (hue !== value) {
      this.syncHueState(hue);
      return;
    }

    // root 快照不会跟随实时 DOM；直接操作优先，先让任何 Mode 快照退场。
    this.interruptModeTransition();
    this.hueController.write(hue);
  }

  /** 与 Hue 相同，Store 同步返回后以最终 Mode 收敛根 class 与请求所有权。 */
  private syncModeState(mode: ThemeMode): void {
    ++this.modeSyncDepth;
    try {
      this.store.syncMode(mode);
    } finally {
      --this.modeSyncDepth;
      if (this.modeSyncDepth !== 0) return;

      /*
       * 其他同步订阅者可能在 action 期间再次修改 mode。
       * 若最终值已变化，就按最终 Store 值重新收敛；否则直接写入根 class。
       */
      const settledMode = this.store.mode;
      if (settledMode !== mode) {
        this.reconcileModeFromStore();
      } else {
        this.modeController.write(settledMode);
      }
    }
  }

  /**
   * 处理绕过 setMode() 的 Store 直接修改。
   * 此时旧状态已经丢失，无法可靠补拍旧快照，所以不追加动画，只立即统一请求、
   * 快照和根 class，保证状态正确性优先。
   */
  private reconcileModeFromStore(): void {
    const mode = this.store.mode;

    // 使所有尚未提交的 setMode 请求失效，并把 Store 视为最新意图。
    ++this.modeRequestId;
    this.requestedMode = mode;
    this.interruptModeTransition();
    this.releaseTransitionLock();
    this.modeController.write(mode);
  }

  /** 跳过旧的根快照动画；这不会撤销已经提交到 Store/DOM 的模式。 */
  private interruptModeTransition(): void {
    this.activeModeTransition?.skipTransition();
    this.activeModeTransition = undefined;
  }

  /** 移除提交锁，恢复组件平时的 hover/focus/active 等局部 transition。 */
  private releaseTransitionLock(): void {
    this.root.removeAttribute(THEME_COMMIT_ATTRIBUTE);
  }
}

/** 使用 Symbol 作为注入键，避免与应用中的其他字符串 key 冲突。 */
export const themeRuntimeKey: InjectionKey<ThemeRuntime> = Symbol("ThemeRuntime");

/** 组件侧统一从这里获取 Runtime；漏掉 app.provide() 时立即给出明确错误。 */
export function useThemeRuntime(): ThemeRuntime {
  const runtime = inject(themeRuntimeKey);

  if (!runtime) {
    throw new Error("ThemeRuntime has not been provided.");
  }

  return runtime;
}
