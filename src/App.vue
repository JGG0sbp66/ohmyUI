<!-- src/App.vue -->
<!--
  预览外壳。色相控制器放在这里，切页面时保持可用。
  外壳使用 zinc 静态色，不跟随主题 token；SpecimenPair 则通过显式
  .light / .dark scope 保持浅深并置，不受全局 mode 影响。
-->
<script setup lang="ts">
import { ref } from "vue";

import ButtonSecondary from "./components/button/ButtonSecondary.vue";
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

        <!--
          nav 单独加 .dark：外壳底色是深的，token 得取深色那套才看得见。
          它不是 SpecimenPair 的祖先，所以并置对照不受影响。
        -->
        <nav class="dark mt-10 flex gap-1 border-b border-border/40" aria-label="预览页面">
          <!-- pb-2 撑出按钮与分隔线之间的空隙，指示器 bottom-0 正好落在分隔线上 -->
          <div v-for="page in PAGES" :key="page.key" class="relative flex items-center pb-2">
            <ButtonSecondary
              :text="page.label"
              :is-active="activeKey === page.key"
              @click="activeKey = page.key"
            />
            <!-- 绝对定位：不占按钮高度，也不影响兄弟元素布局 -->
            <div
              class="absolute right-1 bottom-0 left-1 h-0.75 rounded-t-sm transition-colors"
              :class="activeKey === page.key ? 'bg-accent' : 'bg-transparent'"
            />
          </div>
        </nav>
      </header>

      <main class="mt-10">
        <component :is="activePage()" />
      </main>
    </div>
  </div>
</template>
