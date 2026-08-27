// src/composables/theme/hue.hook.ts
import { createGlobalState } from "@vueuse/core";
import { ref, watch } from "vue";

import { beginShift, endShift } from "./shift";

const HUE_VAR = "--app-hue";
const DURATION_VAR = "--hue-transition-duration";

/** 压制窗口比补间多留的余量，确保补间跑完才把逐元素过渡放回来 */
const SHIFT_MARGIN = 20;

const root = document.documentElement;

/** 读当前色相。默认值来自 CSS，不在 JS 里重复一份 */
function readHueFromRoot(): number {
  const raw = getComputedStyle(root).getPropertyValue(HUE_VAR);
  const parsed = Number.parseFloat(raw);

  return Number.isFinite(parsed) ? parsed : 0;
}

let cachedDuration: number | null = null;

/** 补间时长取自 CSS，和 transitions.css 同源，不用两处同步改 */
function hueDuration(): number {
  if (cachedDuration !== null) return cachedDuration;

  const raw = getComputedStyle(root).getPropertyValue(DURATION_VAR).trim();
  const parsed = raw.endsWith("ms") ? Number.parseFloat(raw) : Number.parseFloat(raw) * 1000;
  const ms = Number.isFinite(parsed) && parsed > 0 ? parsed : 100;

  // 读不到就不进缓存：首次调用可能早于样式表就绪，别把兜底值钉死
  if (raw) cachedDuration = ms;

  return ms;
}

/** 必须写 :root —— 派生 token 声明在那里，写在后代元素上不生效 */
function writeHueToRoot(angle: number): void {
  beginShift();
  root.style.setProperty(HUE_VAR, String(angle));
  endShift(hueDuration() + SHIFT_MARGIN);
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
