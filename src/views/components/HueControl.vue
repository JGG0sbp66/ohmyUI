<!-- src/views/components/HueControl.vue -->
<!-- 预览用：色相控制器。放在外壳里，切换页面时保持可用 -->
<script setup lang="ts">
import { computed } from "vue";

import { useThemeHue } from "@/composables/theme/hue.hook";

/** 色环上的几个落点，一键跳过去 */
const HUE_MARKS = [
  { label: "红", value: 25 },
  { label: "橙", value: 65 },
  { label: "绿", value: 145 },
  { label: "青", value: 195 },
  { label: "蓝", value: 250 },
  { label: "紫", value: 305 },
] as const;

const { hue } = useThemeHue();

/** 滑杆轨道：用 accent 的亮度彩度铺满色环 */
const trackGradient = computed(() => {
  const stops = Array.from({ length: 25 }, (_, i) => `oklch(0.6 0.18 ${i * 15})`);
  return `linear-gradient(to right, ${stops.join(", ")})`;
});
</script>

<template>
  <div>
    <label for="hue" class="block">
      <span class="font-mono text-xs tracking-widest text-zinc-500 uppercase">色相角</span>
      <span class="mt-1 flex items-baseline gap-3 font-mono text-zinc-100" aria-hidden="true">
        <span class="text-5xl tabular-nums sm:text-6xl">{{ hue }}</span>
        <span class="text-lg text-zinc-500">度</span>
      </span>
    </label>

    <input
      id="hue"
      v-model.number="hue"
      type="range"
      min="0"
      max="360"
      step="1"
      class="hue-slider mt-4 w-full"
      :style="{ '--track': trackGradient }"
    />

    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="mark in HUE_MARKS"
        :key="mark.value"
        type="button"
        class="rounded-full border px-3 py-1 font-mono text-xs transition-colors"
        :class="
          hue === mark.value
            ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
            : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
        "
        @click="hue = mark.value"
      >
        {{ mark.label }} {{ mark.value }}
      </button>
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
  border: 3px solid var(--color-zinc-950);
  border-radius: 9999px;
  background: white;
}

.hue-slider::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  border: 3px solid var(--color-zinc-950);
  border-radius: 9999px;
  background: white;
}

/* 键盘可达 */
.hue-slider:focus-visible {
  outline: 2px solid var(--color-zinc-100);
  outline-offset: 4px;
  border-radius: 9999px;
}
</style>
