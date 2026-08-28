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

/** Pinia 导出 hue */
export const useThemeStore = defineStore("theme", () => {
  const hueController = new HueController(document.documentElement);
  const hue = ref(hueController.read());

  watch(hue, (angle) => hueController.write(angle));

  return { hue };
});
