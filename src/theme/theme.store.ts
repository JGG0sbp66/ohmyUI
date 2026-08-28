import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { THEME_MODES, type ThemeMode } from "./theme.model";

/**
 * Pinia 只保存可观察的主题状态。
 * DOM 读写和动画由 ThemeRuntime 负责；这里的 sync 方法只同步仓库值。
 */
export const useThemeStore = defineStore("theme", () => {
  const modes = THEME_MODES;
  const hue = ref<number | null>(null);
  const mode = ref<ThemeMode>(THEME_MODES[0]);

  /** Runtime 会在 Vue 挂载前从 CSS 初始化 Hue；提前消费表示安装顺序有误。 */
  const currentHue = computed<number>(() => {
    if (hue.value === null) {
      throw new Error("ThemeRuntime must be initialized before reading the current hue.");
    }

    return hue.value;
  });

  function syncHue(value: number): void {
    hue.value = value;
  }

  function syncMode(value: ThemeMode): void {
    mode.value = value;
  }

  return { modes, hue, currentHue, mode, syncHue, syncMode };
});

export type ThemeStore = ReturnType<typeof useThemeStore>;
