import { watch } from "vue";

import type { ThemeStore } from "./theme.store";

const HUE_PROPERTY = "--app-hue";

/** 判断一个值能否作为 CSS Hue 使用。 */
function isValidHue(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 360;
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
    if (raw.length === 0 || !isValidHue(parsed)) {
      throw new Error(
        '无法读取合法的主题色相：请确保初始化 ThemeRuntime 前已导入 ohmyUI 样式，并且 "--app-hue" 是 0～360 的数字。',
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
 * Hue 子运行时。
 * 负责 CSS 默认值、Pinia 状态和根 CSS 变量之间的同步；Hue 是连续值，
 * 拖动时直接落位，不创建 View Transition 快照。
 */
export class HueRuntime {
  private readonly controller: HueController;
  private syncDepth = 0;

  constructor(
    private readonly store: ThemeStore,
    root: HTMLElement,
    private readonly beforeWrite: () => void,
  ) {
    this.controller = new HueController(root);
  }

  /** 从 CSS 唯一默认值初始化 Store，并监听绕过 Runtime 的直接 Store 修改。 */
  initialize(): void {
    this.syncState(this.controller.read());

    watch(
      () => this.store.hue,
      () => {
        if (this.syncDepth > 0) return;
        this.reconcileFromStore();
      },
      { flush: "sync" },
    );
  }

  /** 严格校验并立即同步 Hue，不做视觉补间。 */
  setHue(value: number): void {
    if (!isValidHue(value)) {
      throw new RangeError("主题色相必须是 0～360 的有限数字。");
    }

    this.syncState(value);
  }

  /**
   * Store action 可能触发其他同步订阅者继续改值；返回后只认 Pinia 的最终值，
   * 再更新 CSS，避免依赖 watcher 注册顺序或中间值。
   */
  private syncState(hue: number): void {
    ++this.syncDepth;
    try {
      this.store.syncHue(hue);
    } finally {
      --this.syncDepth;

      // 最外层写入结束后统一收敛，嵌套写入只负责更新 Store。
      if (this.syncDepth === 0) this.reconcileFromStore();
    }
  }

  /** 将 Pinia 中最终的 Hue 严格校验并写回根 CSS 变量。 */
  private reconcileFromStore(): void {
    const value = this.store.hue;

    // null 只表示 Runtime 尚未初始化；从 CSS 唯一默认值恢复即可。
    if (value === null) {
      this.syncState(this.controller.read());
      return;
    }

    // 绕过 setHue() 直接写入 Store 的非法值同样不能静默进入 DOM。
    if (!isValidHue(value)) {
      throw new RangeError("主题色相必须是 0～360 的有限数字。");
    }

    // 根快照不会跟随实时 DOM；Hue 写入前先让正在播放的 Mode 快照退场。
    this.beforeWrite();
    this.controller.write(value);
  }
}
