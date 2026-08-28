// src/composables/theme/hue.hook.ts
import { createGlobalState } from "@vueuse/core";
import { ref, watch } from "vue";

const HUE_VAR = "--app-hue";

const root = document.documentElement;

/** 读当前色相。默认值来自 CSS，不在 JS 里重复一份 */
function readHueFromRoot(): number {
  const raw = getComputedStyle(root).getPropertyValue(HUE_VAR);
  const parsed = Number.parseFloat(raw);

  return Number.isFinite(parsed) ? parsed : 0;
}

/** 必须写 :root —— 派生 token 声明在那里，写在后代元素上不生效 */
function writeHueToRoot(angle: number): void {
  root.style.setProperty(HUE_VAR, String(angle));
}

/**
 * 全站主题色相（0–360）。改这一个数，所有语义色跟着变。
 *
 * @example
 * const { hue } = useThemeHue();
 * hue.value = 145;
 */
export const useThemeHue = createGlobalState(() => {
  const hue = ref(readHueFromRoot());

  watch(hue, writeHueToRoot);

  return { hue };
});
