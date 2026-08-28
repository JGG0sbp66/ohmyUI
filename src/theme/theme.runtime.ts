import { inject, type InjectionKey } from "vue";

import { HueRuntime } from "./hue.runtime";
import { ModeRuntime } from "./mode.runtime";
import type { ThemeMode } from "./theme.model";
import type { ThemeStore } from "./theme.store";

/**
 * 浏览器主题运行时的公共门面。
 *
 * HueRuntime 负责连续 Hue 与 CSS 变量同步；ModeRuntime 负责离散模式与
 * View Transition。组件只依赖这个门面，不需要知道内部拆分。
 */
export class ThemeRuntime {
  private readonly hueRuntime: HueRuntime;
  private readonly modeRuntime: ModeRuntime;
  private initialized = false;

  constructor(store: ThemeStore, document: Document) {
    this.modeRuntime = new ModeRuntime(store, document);
    this.hueRuntime = new HueRuntime(store, document.documentElement, () =>
      this.modeRuntime.interruptTransition(),
    );
  }

  /**
   * 在 Vue 挂载前初始化两个子运行时。
   * Hue 先从 CSS 读取唯一默认值，Mode 再从根 class 或系统偏好建立初始状态。
   */
  initialize(): void {
    if (this.initialized) return;

    this.hueRuntime.initialize();
    this.modeRuntime.initialize();
    this.initialized = true;
  }

  /** 立即同步连续 Hue，不创建 View Transition。 */
  setHue(value: number): void {
    this.hueRuntime.setHue(value);
  }

  /** 使用 Mode 子运行时切换离散主题模式。 */
  setMode(mode: ThemeMode): Promise<void> {
    return this.modeRuntime.setMode(mode);
  }
}

/** 使用 Symbol 作为注入键，避免与应用中的其他字符串 key 冲突。 */
export const themeRuntimeKey: InjectionKey<ThemeRuntime> = Symbol("ThemeRuntime");

/** 组件侧统一从这里获取 Runtime；漏掉 app.provide() 时立即给出明确错误。 */
export function useThemeRuntime(): ThemeRuntime {
  const runtime = inject(themeRuntimeKey);

  if (!runtime) {
    throw new Error("ThemeRuntime 尚未通过应用依赖注入提供。");
  }

  return runtime;
}
