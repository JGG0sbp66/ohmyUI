<!-- src/views/components/HueControl.vue -->
<!-- 预览用：色相控制器。放在外壳里，切换页面时保持可用 -->
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";

import ButtonTertiary from "@/components/button/ButtonTertiary.vue";
import { useThemeRuntime, useThemeStore } from "@/theme";

/** 色环上的几个落点，一键跳过去 */
const HUE_MARKS = [
  { label: "红", value: 25 },
  { label: "橙", value: 65 },
  { label: "绿", value: 145 },
  { label: "青", value: 195 },
  { label: "蓝", value: 250 },
  { label: "紫", value: 305 },
] as const;

const themeStore = useThemeStore();
const themeRuntime = useThemeRuntime();
const { currentHue: hue } = storeToRefs(themeStore);

/** v-model 保持模板简洁，实际写入由 Runtime 同步提交到 Pinia 与根 CSS 变量。 */
const hueModel = computed({
  get: () => hue.value,
  set: (value: number) => themeRuntime.setHue(value),
});

/** 滑杆轨道：用固定亮度和彩度铺满色环，让色相位置不随 mode 漂移 */
const trackGradient = computed(() => {
  const stops = Array.from({ length: 25 }, (_, i) => `oklch(0.6 0.18 ${i * 15})`);
  return `linear-gradient(to right, ${stops.join(", ")})`;
});
</script>

<template>
  <div>
    <label for="hue" class="block">
      <span class="font-mono text-xs tracking-widest text-fg-subtle uppercase">色相角</span>
      <span class="mt-1 flex items-baseline gap-3 font-mono text-fg" aria-hidden="true">
        <span class="text-5xl tabular-nums sm:text-6xl">{{ hue }}</span>
        <span class="text-lg text-fg-muted">度</span>
      </span>
    </label>

    <input
      id="hue"
      v-model.number="hueModel"
      type="range"
      min="0"
      max="360"
      step="1"
      class="hue-slider mt-4 w-full"
      :style="{ '--track': trackGradient }"
    />

    <div class="mt-3 flex flex-wrap gap-2">
      <ButtonTertiary
        v-for="mark in HUE_MARKS"
        :key="mark.value"
        :text="`${mark.label} ${mark.value}`"
        :is-active="hue === mark.value"
        @click="themeRuntime.setHue(mark.value)"
      />
    </div>
  </div>
</template>

<style scoped>
/* 原生 range 的轨道和滑块只能分别用厂商伪元素定制，没有统一写法 */
.hue-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 2.5rem;
  background: transparent;
  cursor: pointer;
}

.hue-slider::-webkit-slider-runnable-track {
  height: 0.75rem;
  border-radius: 9999px;
  background: var(--track);
}

.hue-slider::-moz-range-track {
  height: 0.75rem;
  border-radius: 9999px;
  background: var(--track);
}

.hue-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: -0.25rem;
  border: 3px solid var(--theme-bg);
  border-radius: 9999px;
  background: var(--theme-fg);
}

.hue-slider::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  border: 3px solid var(--theme-bg);
  border-radius: 9999px;
  background: var(--theme-fg);
}

/* 键盘可达 */
.hue-slider:focus-visible {
  outline: 2px solid var(--theme-fg);
  outline-offset: 4px;
  border-radius: 9999px;
}
</style>
