import { nextTick, watch } from "vue";

import { THEME_MODES, type ThemeMode } from "./theme.model";
import type { ThemeStore } from "./theme.store";

/*
 * Mode 提交新快照时使用的临时锁。
 * base.css 会在属性存在期间关闭组件自己的 transition，避免局部颜色动画
 * 和整页 View Transition 快照互相打架。
 */
const THEME_COMMIT_ATTRIBUTE = "data-theme-committing";

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
    return matchesMedia(this.view, "(prefers-color-scheme: dark)") ? "dark" : "light";
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
 * Mode 子运行时。
 * 负责模式 Store、根 class、系统偏好和 View Transition 生命周期之间的同步。
 */
export class ModeRuntime {
  private readonly root: HTMLElement;
  private readonly view: Window | null;
  private readonly controller: ModeController;

  /** 当前仍在播放的根节点快照过渡；新请求到来时可以立即跳过它。 */
  private activeTransition: ViewTransition | undefined;

  /**
   * Mode 请求的递增版本号。
   * 每次新请求都会让旧 callback 失效，从而保证快速连点时“最后一次选择获胜”。
   */
  private requestId = 0;

  /** 最新的用户意图；View Transition 尚未提交时，它可能暂时领先于 Store。 */
  private requestedMode: ThemeMode;

  /** 区分 Runtime 自己的 Store 写入与 DevTools/$patch 等外部直接写入。 */
  private syncDepth = 0;

  constructor(
    private readonly store: ThemeStore,
    private readonly document: Document,
  ) {
    this.root = document.documentElement;
    this.view = document.defaultView;
    this.controller = new ModeController(this.root, this.view);
    this.requestedMode = store.mode;
  }

  /** 从现有根 class/系统偏好初始化 Mode，并监听直接 Store 修改。 */
  initialize(): void {
    this.syncState(this.controller.read());
    this.requestedMode = this.store.mode;

    /*
     * Runtime API 是正常写入口；这个同步 watcher 是仓库兜底。直接改 mode 不补动画，
     * 因为状态已经发生，无法再可靠捕获旧快照，只做确定性的原子落位。
     */
    watch(
      () => this.store.mode,
      () => {
        if (this.syncDepth > 0) return;
        this.reconcileFromStore();
      },
      { flush: "sync" },
    );
  }

  /**
   * Mode 是离散操作：先保留旧快照，再原子提交新状态，由根 View Transition
   * 统一呈现主题变化。连续请求采用最后一次选择，旧过渡会被立即跳过。
   */
  async setMode(mode: ThemeMode): Promise<void> {
    // Store、最新请求和 DOM 都已处于目标模式时，无需再创建快照。
    if (
      mode === this.requestedMode &&
      mode === this.store.mode &&
      this.controller.isApplied(mode)
    ) {
      return;
    }

    // 新编号会使尚未执行的旧 commit() 直接退出。
    this.requestedMode = mode;
    const requestId = ++this.requestId;

    // 正在播放的旧快照不再代表最新选择，应立即退场。
    this.interruptTransition();

    // 可用于撤回尚未提交的请求，例如快速点击 dark 后立刻点回当前 light。
    if (mode === this.store.mode && this.controller.isApplied(mode)) {
      this.releaseTransitionLock();
      return;
    }

    const startViewTransition = this.document.startViewTransition?.bind(this.document);
    const reduceMotion = matchesMedia(this.view, "(prefers-reduced-motion: reduce)");

    // 浏览器不支持 View Transition，或用户要求减少动态效果时，走无动画提交。
    if (!startViewTransition || reduceMotion) {
      await this.commitWithoutAnimation(mode, requestId);
      return;
    }

    let transition: ViewTransition;

    try {
      // 浏览器先截取旧页面，再在 callback 中提交新主题并截取新页面。
      transition = startViewTransition(() => this.commit(mode, requestId));
    } catch {
      // 某些浏览器环境即使暴露了 API 也可能启动失败，必须保证主题仍能切换。
      await this.commitWithoutAnimation(mode, requestId);
      return;
    }

    this.activeTransition = transition;

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
      if (requestId === this.requestId) this.releaseTransitionLock();
    }

    // finished 只代表视觉动画结束，不影响模式是否已经提交。
    await transition.finished.catch(() => undefined);
    if (this.activeTransition === transition) this.activeTransition = undefined;
  }

  /** 跳过旧的根快照动画；这不会撤销已经提交到 Store/DOM 的模式。 */
  interruptTransition(): void {
    this.activeTransition?.skipTransition();
    this.activeTransition = undefined;
  }

  /** 在 View Transition 的 update callback 中原子提交新模式。 */
  private async commit(mode: ThemeMode, requestId: number): Promise<void> {
    // 过期请求不允许覆盖更新的用户选择。
    if (requestId !== this.requestId) return;

    /*
     * 先加锁，再修改 Store 和根 class。base.css 会临时关闭所有局部 transition，
     * 确保浏览器捕获的是已经稳定的新主题，而不是各组件颜色变化到一半的状态。
     */
    this.root.setAttribute(THEME_COMMIT_ATTRIBUTE, "");
    this.syncState(mode);

    // 等所有依赖 mode 的 Vue DOM（包括控制器选中态）更新后再拍新快照。
    await nextTick();
  }

  /** 不创建快照，但仍沿用同一套原子提交和 transition 锁。 */
  private async commitWithoutAnimation(mode: ThemeMode, requestId: number): Promise<void> {
    try {
      await this.commit(mode, requestId);

      /*
       * 强制浏览器在移除锁之前完成一次样式计算，确保新的主题颜色是在
       * transition: none 的状态下落位，不会触发组件自己的颜色过渡。
       */
      if (requestId === this.requestId) void this.root.offsetWidth;
    } finally {
      if (requestId === this.requestId) this.releaseTransitionLock();
    }
  }

  /** Store action 返回后只认 Pinia 最终值，再统一更新根 class。 */
  private syncState(mode: ThemeMode): void {
    ++this.syncDepth;
    try {
      this.store.syncMode(mode);
    } finally {
      --this.syncDepth;
    }

    if (this.syncDepth !== 0) return;

    /*
     * 其他同步订阅者可能在 action 期间再次修改 mode。
     * 若最终值已变化，就按最终 Store 值重新收敛；否则直接写入根 class。
     */
    const settledMode = this.store.mode;
    if (settledMode !== mode) {
      this.reconcileFromStore();
    } else {
      this.controller.write(settledMode);
    }
  }

  /**
   * 处理绕过 setMode() 的 Store 直接修改。
   * 此时旧状态已经丢失，无法可靠补拍旧快照，所以不追加动画，只立即统一请求、
   * 快照和根 class，保证状态正确性优先。
   */
  private reconcileFromStore(): void {
    const mode = this.store.mode;

    // 使所有尚未提交的 setMode 请求失效，并把 Store 视为最新意图。
    ++this.requestId;
    this.requestedMode = mode;
    this.interruptTransition();
    this.releaseTransitionLock();
    this.controller.write(mode);
  }

  /** 移除提交锁，恢复组件平时的 hover/focus/active 等局部 transition。 */
  private releaseTransitionLock(): void {
    this.root.removeAttribute(THEME_COMMIT_ATTRIBUTE);
  }
}
