<!-- src/views/Tokens.page.vue -->
<!-- 设计 token 展示页。往 styles 里加 token 时，同步往 TOKEN_GROUPS 里加一条 -->
<script setup lang="ts">
import { computed } from "vue";

import { useThemeHue } from "@/composables/theme.hook";

/** 色值：跟随 hue 的 oklch，或不跟随的字面量（如 white） */
type Tone = { l: number; c: number } | { literal: string };

interface Token {
  cls: string;
  variable: string;
  role: string;
  /** 色块渲染方式：填充，或只画描边（边框色用实心块会误导） */
  preview: "fill" | "border";
  light: Tone;
  dark: Tone;
}

/** token 定义，数值来自 styles/theme/light.css 与 dark.css。色块与表格共用这份数据 */
const TOKEN_GROUPS: { title: string; note: string; tokens: Token[] }[] = [
  {
    title: "强调色",
    note: "一套连续的交互态。浅色下悬停变暗、深色下悬停变亮 —— 两种底色上「更明显」的方向是相反的。",
    tokens: [
      {
        cls: "bg-accent",
        variable: "--theme-accent",
        role: "常态",
        preview: "fill",
        light: { l: 0.6, c: 0.18 },
        dark: { l: 0.65, c: 0.18 },
      },
      {
        cls: "bg-accent-hover",
        variable: "--theme-accent-hover",
        role: "悬停",
        preview: "fill",
        light: { l: 0.55, c: 0.18 },
        dark: { l: 0.7, c: 0.18 },
      },
      {
        cls: "bg-accent-active",
        variable: "--theme-accent-active",
        role: "按下",
        preview: "fill",
        light: { l: 0.5, c: 0.18 },
        dark: { l: 0.6, c: 0.18 },
      },
    ],
  },
  {
    title: "背景色",
    note: "明暗层级在两种模式下不一样：浅色下 card 最亮、muted 最暗；深色下 muted 最亮、bg 最暗。card 在浅色下钉死纯白，不跟随色相 —— 带色偏的卡片会显脏。",
    tokens: [
      {
        cls: "bg-bg",
        variable: "--theme-bg",
        role: "页面主背景",
        preview: "fill",
        light: { l: 0.97, c: 0.01 },
        dark: { l: 0.16, c: 0.014 },
      },
      {
        cls: "bg-bg-muted",
        variable: "--theme-bg-muted",
        role: "次级区块",
        preview: "fill",
        light: { l: 0.95, c: 0.03 },
        dark: { l: 0.25, c: 0.03 },
      },
      {
        cls: "bg-bg-card",
        variable: "--theme-bg-card",
        role: "卡片",
        preview: "fill",
        light: { literal: "white" },
        dark: { l: 0.2, c: 0.02 },
      },
    ],
  },
  {
    title: "边框色",
    note: "分隔线与描边，只有一档。浅色下比背景略深、深色下比背景略浅，都是与背景差一档的对比。",
    tokens: [
      {
        cls: "border-border",
        variable: "--theme-border",
        role: "分隔线 / 描边",
        preview: "border",
        light: { l: 0.9, c: 0.02 },
        dark: { l: 0.3, c: 0.03 },
      },
    ],
  },
];

/** 两种模式共用同一份 markup，靠 .dark 类切换取值 */
const MODES = [
  { label: ":root（浅色）", scope: "", tone: "light" as const },
  { label: ".dark（深色）", scope: "dark", tone: "dark" as const },
];

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

function toneText(tone: Tone): string {
  return "literal" in tone ? tone.literal : `oklch(${tone.l} ${tone.c} ${hue.value})`;
}
</script>

<template>
  <div class="min-h-svh bg-zinc-950 font-sans text-zinc-300 antialiased">
    <div class="mx-auto max-w-4xl px-6 py-14 sm:px-8 sm:py-20">
      <header>
        <p class="font-mono text-xs tracking-widest text-zinc-500 uppercase">ohmyUI · 设计 token</p>
        <h1 class="mt-3 text-2xl font-medium text-zinc-100 sm:text-3xl">一个数字决定全部颜色</h1>
        <p class="mt-3 max-w-xl text-sm/6 text-zinc-400">
          每个语义色都写成
          <code class="font-mono text-zinc-300">oklch(亮度 彩度 var(--app-hue))</code>
          。亮度和彩度各自固定，色相共用同一个变量。拖动下面的滑杆，只有这一个数在变，所有颜色跟着一起转
          —— 它们不可能失步，因为压根只有一个动画。
        </p>

        <!-- 色相控制器 -->
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

      <!-- 浅深并置对照。两栏 markup 相同，深色栏靠 .dark 类取另一套值 -->
      <section class="mt-16">
        <h2 class="font-mono text-xs tracking-widest text-zinc-500 uppercase">浅色 / 深色</h2>
        <p class="mt-2 max-w-xl text-sm/6 text-zinc-400">
          两栏色相相同，亮度不同。面板本身就用 <code class="font-mono">bg-bg-card</code>
          搭的，所以它也在演示自己展示的东西。
        </p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <article
            v-for="mode in MODES"
            :key="mode.tone"
            class="rounded-xl bg-bg-card p-5 ring-1 ring-zinc-900/10 dark:ring-white/10"
            :class="mode.scope"
          >
            <h3 class="font-mono text-xs text-zinc-500">{{ mode.label }}</h3>

            <div v-for="group in TOKEN_GROUPS" :key="group.title" class="mt-5">
              <p class="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                {{ group.title }}
              </p>
              <ul class="mt-2.5 space-y-2.5">
                <li v-for="token in group.tokens" :key="token.cls" class="flex items-center gap-3">
                  <span
                    v-if="token.preview === 'fill'"
                    class="size-11 shrink-0 rounded-lg ring-1 ring-zinc-900/10 dark:ring-white/10"
                    :class="token.cls"
                  ></span>
                  <span
                    v-else
                    class="size-11 shrink-0 rounded-lg border-2"
                    :class="token.cls"
                  ></span>
                  <span class="min-w-0 font-mono text-xs">
                    <span class="block truncate text-zinc-900 dark:text-zinc-100">
                      {{ token.cls }}
                    </span>
                    <span class="block truncate text-zinc-500">
                      {{ toneText(token[mode.tone]) }}
                    </span>
                  </span>
                </li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      <!-- 交互态 -->
      <section class="mt-16">
        <h2 class="font-mono text-xs tracking-widest text-zinc-500 uppercase">交互态</h2>
        <p class="mt-2 max-w-xl text-sm/6 text-zinc-400">
          把鼠标移上去、按住不放，能看出三个强调色的关系。这里刻意没加颜色过渡 ——
          过渡会去追不断变化的色相，反而滞后。
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-4">
          <span
            v-for="mode in MODES"
            :key="mode.tone"
            class="inline-flex rounded-xl bg-bg-card p-3 ring-1 ring-zinc-900/10 dark:ring-white/10"
            :class="mode.scope"
          >
            <button
              type="button"
              class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover active:bg-accent-active"
            >
              按钮
            </button>
          </span>
        </div>
      </section>

      <!-- 工具类与变量对照 -->
      <section class="mt-16 space-y-8">
        <h2 class="font-mono text-xs tracking-widest text-zinc-500 uppercase">对应关系</h2>

        <div v-for="group in TOKEN_GROUPS" :key="group.title">
          <h3 class="text-sm text-zinc-200">{{ group.title }}</h3>
          <p class="mt-1.5 max-w-xl text-xs/5 text-zinc-500">{{ group.note }}</p>

          <div class="mt-4 overflow-x-auto">
            <table class="w-full border-collapse text-left font-mono text-xs">
              <thead>
                <tr class="text-zinc-500">
                  <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">工具类</th>
                  <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">
                    CSS 变量
                  </th>
                  <th scope="col" class="border-b border-zinc-800 py-2 font-normal">用途</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="token in group.tokens" :key="token.cls" class="text-zinc-400">
                  <td class="border-b border-zinc-900 py-2.5 pr-4 text-zinc-100">
                    {{ token.cls }}
                  </td>
                  <td class="border-b border-zinc-900 py-2.5 pr-4">{{ token.variable }}</td>
                  <td class="border-b border-zinc-900 py-2.5">{{ token.role }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p class="text-xs/5 text-zinc-500">
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
