<!-- src/App.vue -->
<!--
  预览外壳。全局控制器放在这里，切换页面时保持可用。
  展示站自身使用语义主题 token，跟随根节点上的 mode；SpecimenPair 则通过
  显式 .light / .dark scope 保持浅深并置，不受全局 mode 影响。
-->
<script setup lang="ts">
import { ref } from "vue";

import ButtonSecondary from "./components/button/ButtonSecondary.vue";
import ButtonsPage from "./views/buttons/Buttons.page.vue";
import HueControl from "./views/components/HueControl.vue";
import ModeControl from "./views/components/ModeControl.vue";
import InputsPage from "./views/inputs/Inputs.page.vue";
import TokensPage from "./views/tokens/Tokens.page.vue";

/** 新增分类页时在这里加一条，导航自动跟着长 */
const PAGES = [
  { key: "tokens", label: "设计 token", component: TokensPage },
  { key: "buttons", label: "按钮", component: ButtonsPage },
  { key: "inputs", label: "输入框", component: InputsPage },
] as const;

const activeKey = ref<(typeof PAGES)[number]["key"]>("tokens");
const activePage = () => PAGES.find((page) => page.key === activeKey.value)!.component;
</script>

<template>
  <div class="min-h-svh bg-bg font-sans text-fg antialiased">
    <div class="mx-auto max-w-4xl px-6 py-14 sm:px-8 sm:py-20">
      <header>
        <div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-6">
          <div class="min-w-0">
            <p class="font-mono text-xs tracking-widest text-fg-subtle uppercase">ohmyUI</p>
            <h1 class="mt-3 text-2xl font-medium text-fg sm:text-3xl">一个数字决定全部颜色</h1>
          </div>

          <ModeControl class="shrink-0" />
        </div>

        <HueControl class="mt-8" />

        <!-- nav 跟随 root mode；只有 SpecimenPair 内部保留显式浅深 scope -->
        <nav class="mt-10 flex gap-1 border-b border-border/40" aria-label="预览页面">
          <!-- pb-2 撑出按钮与分隔线之间的空隙，指示器 bottom-0 正好落在分隔线上 -->
          <div v-for="page in PAGES" :key="page.key" class="relative flex items-center pb-2">
            <ButtonSecondary
              :text="page.label"
              :is-active="activeKey === page.key"
              @click="activeKey = page.key"
            />
            <!-- 绝对定位：不占按钮高度，也不影响兄弟元素布局 -->
            <div
              class="absolute right-1 bottom-0 left-1 h-0.75 rounded-t-sm bg-accent transition-opacity"
              :class="activeKey === page.key ? 'opacity-100' : 'opacity-0'"
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
