<!-- src/views/Tokens.page.vue -->
<!-- 设计 token 展示页。往 styles 里加 token 时，同步往 TOKENS 里加一条 -->
<script setup lang="ts">
import { computed } from "vue";

import { useThemeHue } from "@/composables/theme.hook";

/** token 定义，数值来自 styles/theme/light.css 与 dark.css。色块与表格共用这份数据 */
const TOKENS = [
  {
    cls: "bg-accent",
    variable: "--theme-accent",
    lightL: 0.6,
    darkL: 0.65,
    chroma: 0.18,
    role: "常态",
  },
  {
    cls: "bg-accent-hover",
    variable: "--theme-accent-hover",
    lightL: 0.55,
    darkL: 0.7,
    chroma: 0.18,
    role: "悬停",
  },
  {
    cls: "bg-accent-active",
    variable: "--theme-accent-active",
    lightL: 0.5,
    darkL: 0.6,
    chroma: 0.18,
    role: "按下",
  },
] as const;

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

function formula(lightness: number, chroma: number) {
  return `oklch(${lightness} ${chroma} ${hue.value})`;
}
</script>

<template>
  <div class="min-h-svh bg-zinc-950 font-sans text-zinc-300 antialiased">
    <div class="mx-auto max-w-4xl px-6 py-14 sm:px-8 sm:py-20">
      <!-- 色相控制器 -->
      <header>
        <p class="font-mono text-xs tracking-widest text-zinc-500 uppercase">ohmyUI · 设计 token</p>
        <h1 class="mt-3 text-2xl font-medium text-zinc-100 sm:text-3xl">一个数字决定全部颜色</h1>
        <p class="mt-3 max-w-xl text-sm/6 text-zinc-400">
          每个语义色都写成
          <code class="font-mono text-zinc-300">oklch(亮度 彩度 var(--app-hue))</code>
          。亮度和彩度各自固定，色相共用同一个变量。拖动下面的滑杆，只有这一个数在变，所有颜色跟着一起转
          —— 它们不可能失步，因为压根只有一个动画。
        </p>

        <div class="mt-10">
          <label for="hue" class="block">
            <span class="font-mono text-xs tracking-widest text-zinc-500 uppercase"> 色相角 </span>
            <span class="mt-1 flex items-baseline gap-3 font-mono text-zinc-100" aria-hidden="true">
              <span class="text-6xl tabular-nums sm:text-7xl">{{ hue }}</span>
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
            class="hue-slider mt-5 w-full"
            :style="{ '--track': trackGradient }"
          />

          <div class="mt-4 flex flex-wrap gap-2">
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
      </header>

      <!-- 浅深并置对照 -->
      <section class="mt-16">
        <h2 class="font-mono text-xs tracking-widest text-zinc-500 uppercase">浅色 / 深色</h2>
        <p class="mt-2 max-w-xl text-sm/6 text-zinc-400">
          两栏色相完全相同，只有亮度不同。注意浅色里悬停变暗、深色里悬停变亮 ——
          因为两种底色下「更明显」的方向是相反的。
        </p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <!-- 无 .dark 祖先，取 :root 的值 -->
          <article class="rounded-xl bg-zinc-100 p-5">
            <h3 class="font-mono text-xs text-zinc-500">:root（浅色）</h3>
            <ul class="mt-4 space-y-3">
              <li v-for="token in TOKENS" :key="token.cls" class="flex items-center gap-3">
                <span class="size-11 shrink-0 rounded-lg" :class="token.cls"></span>
                <span class="min-w-0 font-mono text-xs text-zinc-600">
                  <span class="block truncate text-zinc-900">{{ token.cls }}</span>
                  <span class="block truncate">
                    {{ formula(token.lightL, token.chroma) }}
                  </span>
                </span>
              </li>
            </ul>
          </article>

          <!-- .dark 类作用于子树，也是新项目里的用法 -->
          <article class="dark rounded-xl bg-zinc-900 p-5 ring-1 ring-zinc-800">
            <h3 class="font-mono text-xs text-zinc-500">.dark（深色）</h3>
            <ul class="mt-4 space-y-3">
              <li v-for="token in TOKENS" :key="token.cls" class="flex items-center gap-3">
                <span class="size-11 shrink-0 rounded-lg" :class="token.cls"></span>
                <span class="min-w-0 font-mono text-xs text-zinc-500">
                  <span class="block truncate text-zinc-100">{{ token.cls }}</span>
                  <span class="block truncate">
                    {{ formula(token.darkL, token.chroma) }}
                  </span>
                </span>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <!-- 交互态 -->
      <section class="mt-16">
        <h2 class="font-mono text-xs tracking-widest text-zinc-500 uppercase">交互态</h2>
        <p class="mt-2 max-w-xl text-sm/6 text-zinc-400">
          三个 token 是一套连续的状态。把鼠标移上去、按住不放，能看出它们的关系。
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover active:bg-accent-active"
          >
            浅色底按钮
          </button>

          <span class="dark inline-flex rounded-xl bg-zinc-900 p-3">
            <button
              type="button"
              class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover active:bg-accent-active"
            >
              深色底按钮
            </button>
          </span>
        </div>
      </section>

      <!-- 工具类与变量对照 -->
      <section class="mt-16">
        <h2 class="font-mono text-xs tracking-widest text-zinc-500 uppercase">对应关系</h2>

        <div class="mt-6 overflow-x-auto">
          <table class="w-full border-collapse text-left font-mono text-xs">
            <thead>
              <tr class="text-zinc-500">
                <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">工具类</th>
                <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">CSS 变量</th>
                <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">浅色亮度</th>
                <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">深色亮度</th>
                <th scope="col" class="border-b border-zinc-800 py-2 font-normal">用途</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="token in TOKENS" :key="token.cls" class="text-zinc-400">
                <td class="border-b border-zinc-900 py-2.5 pr-4 text-zinc-100">
                  {{ token.cls }}
                </td>
                <td class="border-b border-zinc-900 py-2.5 pr-4">
                  {{ token.variable }}
                </td>
                <td class="border-b border-zinc-900 py-2.5 pr-4 tabular-nums">
                  {{ token.lightL }}
                </td>
                <td class="border-b border-zinc-900 py-2.5 pr-4 tabular-nums">
                  {{ token.darkL }}
                </td>
                <td class="border-b border-zinc-900 py-2.5">{{ token.role }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="mt-4 text-xs/5 text-zinc-500">
          前缀可换：<code class="text-zinc-400">bg-</code>、<code class="text-zinc-400">text-</code
          >、<code class="text-zinc-400">border-</code>、<code class="text-zinc-400">ring-</code>
          都能用同一个 token 名。
        </p>
      </section>
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
