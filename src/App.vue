<!-- src/App.vue -->
<!--
  预览外壳。色相控制器放在这里，切页面时保持可用。
  外壳本身用 zinc 静态色而不是 token —— 它必须待在 .dark 之外，
  否则 SpecimenPair 的浅色栏会继承到深色值，并置对照就失效了。
-->
<script setup lang="ts">
import { ref } from "vue";

import ButtonsPage from "./views/buttons/Buttons.page.vue";
import HueControl from "./views/components/HueControl.vue";
import TokensPage from "./views/tokens/Tokens.page.vue";

/** 新增分类页时在这里加一条，导航自动跟着长 */
const PAGES = [
  { key: "tokens", label: "设计 token", component: TokensPage },
  { key: "buttons", label: "按钮", component: ButtonsPage },
] as const;

const activeKey = ref<(typeof PAGES)[number]["key"]>("tokens");
const activePage = () => PAGES.find((page) => page.key === activeKey.value)!.component;
</script>

<template>
  <div class="min-h-svh bg-zinc-950 font-sans text-zinc-300 antialiased">
    <div class="mx-auto max-w-4xl px-6 py-14 sm:px-8 sm:py-20">
      <header>
        <p class="font-mono text-xs tracking-widest text-zinc-500 uppercase">ohmyUI</p>
        <h1 class="mt-3 text-2xl font-medium text-zinc-100 sm:text-3xl">一个数字决定全部颜色</h1>

        <HueControl class="mt-8" />

        <nav class="mt-10 flex gap-1 border-b border-zinc-800" aria-label="预览页面">
          <button
            v-for="page in PAGES"
            :key="page.key"
            type="button"
            class="-mb-px border-b-2 px-3 py-2 text-sm transition-colors"
            :class="
              activeKey === page.key
                ? 'border-zinc-100 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            "
            @click="activeKey = page.key"
          >
            {{ page.label }}
          </button>
        </nav>
      </header>

      <main class="mt-10">
        <component :is="activePage()" />
      </main>
    </div>
  </div>
</template>
