<!-- src/views/tokens/Tokens.page.vue -->
<!-- 往 styles 里加 token 时，同步往 TOKEN_GROUPS 里加一条 -->
<script setup lang="ts">
import { useThemeHue } from "@/composables/theme.hook";

import SpecimenPair from "../components/SpecimenPair.vue";

/** 色值：跟随 hue 的 oklch，或不跟随的字面量（如 white） */
type Tone = { l: number; c: number } | { literal: string };

interface Token {
  cls: string;
  variable: string;
  role: string;
  /** 预览方式：填充色块、空心描边、或直接把颜色用在文字上 */
  preview: "fill" | "border" | "text";
  light: Tone;
  dark: Tone;
}

/** 数值来自 styles/theme/light.css 与 dark.css。色块与表格共用这份数据 */
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
    note: "分隔线与描边，只有一档。浅色下比背景略深、深色下比背景略浅，都是与背景差一档的对比。实际用时基本都带透明度（/20 ~ /60），满不透明度只留给需要明确边界的容器外框。",
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
  {
    title: "文本色",
    note: "fg-muted 用半透明黑/白而不是固定灰，靠透出底色，所以放在任何背景上都协调。fg-soft 由 fg-subtle 混 40% 透明派生，跟着它一起变。",
    tokens: [
      {
        cls: "text-fg",
        variable: "--theme-fg",
        role: "主文本",
        preview: "text",
        light: { l: 0.2, c: 0.03 },
        dark: { l: 0.95, c: 0.01 },
      },
      {
        cls: "text-fg-muted",
        variable: "--theme-fg-muted",
        role: "次要文本",
        preview: "text",
        light: { literal: "#00000080" },
        dark: { literal: "#ffffff80" },
      },
      {
        cls: "text-fg-subtle",
        variable: "--theme-fg-subtle",
        role: "更弱的文字 / 图标",
        preview: "text",
        light: { l: 0.65, c: 0.15 },
        dark: { l: 0.75, c: 0.14 },
      },
      {
        cls: "text-fg-soft",
        variable: "--theme-fg-soft",
        role: "占位 / 提示",
        preview: "text",
        light: { literal: "fg-subtle 混 40% 透明" },
        dark: { literal: "fg-subtle 混 40% 透明" },
      },
    ],
  },
];

const { hue } = useThemeHue();

function toneText(tone: Tone): string {
  return "literal" in tone ? tone.literal : `oklch(${tone.l} ${tone.c} ${hue.value})`;
}
</script>

<template>
  <div>
    <p class="max-w-xl text-sm/6 text-zinc-400">
      每个语义色都写成
      <code class="font-mono text-zinc-300">oklch(亮度 彩度 var(--app-hue))</code>
      。亮度和彩度各自固定，色相共用同一个变量，所以拖色相时只有一个数在变，所有颜色一起转，不可能失步。
    </p>

    <!-- 浅深并置对照 -->
    <section class="mt-10">
      <h2 class="font-mono text-xs tracking-widest text-zinc-500 uppercase">浅色 / 深色</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-zinc-400">
        两栏色相相同，亮度不同。面板本身就用 <code class="font-mono">bg-bg-card</code>
        搭的，所以它也在演示自己展示的东西。
      </p>

      <SpecimenPair v-slot="{ tone }" class="mt-6">
        <div v-for="group in TOKEN_GROUPS" :key="group.title" class="mt-5">
          <p class="font-mono text-xs text-fg-subtle">{{ group.title }}</p>
          <ul class="mt-2.5 space-y-2.5">
            <li v-for="token in group.tokens" :key="token.cls" class="flex items-center gap-3">
              <span
                v-if="token.preview === 'fill'"
                class="size-11 shrink-0 rounded-lg ring-1 ring-zinc-900/10 dark:ring-white/10"
                :class="token.cls"
              ></span>
              <span
                v-else-if="token.preview === 'border'"
                class="size-11 shrink-0 rounded-lg border-2"
                :class="token.cls"
              ></span>
              <span
                v-else
                class="flex size-11 shrink-0 items-center justify-center text-xl font-medium"
                :class="token.cls"
                aria-hidden="true"
              >
                Aa
              </span>
              <span class="min-w-0 font-mono text-xs">
                <span class="block break-words text-fg">{{ token.cls }}</span>
                <span class="block break-words text-fg-muted">
                  {{ toneText(token[tone]) }}
                </span>
              </span>
            </li>
          </ul>
        </div>
      </SpecimenPair>
    </section>

    <!-- 交互态 -->
    <section class="mt-16">
      <h2 class="font-mono text-xs tracking-widest text-zinc-500 uppercase">交互态</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-zinc-400">
        把鼠标移上去、按住不放，能看出三个强调色的关系。这里刻意没加颜色过渡 ——
        过渡会去追不断变化的色相，反而滞后。
      </p>

      <SpecimenPair class="mt-6">
        <div class="mt-4">
          <button
            type="button"
            class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover active:bg-accent-active"
          >
            按钮
          </button>
        </div>
      </SpecimenPair>
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
                <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">CSS 变量</th>
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
</template>
