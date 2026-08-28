import { defineStore } from "pinia";
import { ref, watch } from "vue";

class HueController {
  private static readonly CSS_VAR = "--app-hue";

  constructor(private readonly root: HTMLElement) {}

  /** 读当前色相。默认值来自 CSS */
  read(): number {
    const raw = getComputedStyle(this.root).getPropertyValue(HueController.CSS_VAR);
    const parsed = Number.parseFloat(raw);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  /** 将hue写入root，写在后代元素上不生效 */
  write(angle: number): void {
    this.root.style.setProperty(HueController.CSS_VAR, String(angle));
  }
}

class ModeController {
  /**
   * 新增主题时，在这里和对应 CSS 中各增加一项。
   * 将主题 class 写入 root 元素上。
   */
  static readonly MODES = Object.freeze(["light", "dark"] as const);

  private static readonly DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

  constructor(private readonly root: HTMLElement) {}

  read(): ThemeMode {
    /** for 循环遍历 root 上的主题，如果有则返回 */
    for (const mode of ModeController.MODES) {
      if (this.root.classList.contains(mode)) return mode;
    }

    /** 如果 root 上没有主题 class，则根据系统偏好返回默认主题 */
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia(ModeController.DARK_MEDIA_QUERY).matches ? "dark" : "light";
    }

    /** 如果没有系统偏好，则默认使用light主题 */
    return ModeController.MODES[0];
  }

  /** 移除全部已注册主题 class，再写入唯一的目标主题 */
  write(mode: ThemeMode): void {
    this.root.classList.remove(...ModeController.MODES);
    this.root.classList.add(mode);
  }
}

export type ThemeMode = (typeof ModeController.MODES)[number];

/** Pinia 导出全局主题状态 */
export const useThemeStore = defineStore("theme", () => {
  const root = document.documentElement;
  const hueController = new HueController(root);
  const modeController = new ModeController(root);

  /** 读取主题列表，hue，和当前的主题 */
  const modes = ModeController.MODES;
  const hue = ref(hueController.read());
  const mode = ref<ThemeMode>(modeController.read());

  /** 监听 hue 和 mode 的变化，写入 root 元素上 */
  watch(hue, (angle) => hueController.write(angle));
  watch(mode, (value) => modeController.write(value), { immediate: true });

  return { modes, hue, mode };
});
