<!-- src/App.vue -->
<!--
  预览外壳。全局控制器放在这里，切换页面时保持可用。
  展示站自身使用语义主题 token，跟随根节点上的 mode；SpecimenPair 则通过
  显式 .light / .dark scope 保持浅深并置，不受全局 mode 影响。
-->
<script setup lang="ts">
import { ref } from "vue";

import type { FilterTabOption, FilterTabValue } from "./components/navigation/filter-tabs.types";
import FilterTabs from "./components/navigation/FilterTabs.vue";
import ButtonsPage from "./views/buttons/Buttons.page.vue";
import CardsPage from "./views/cards/Cards.page.vue";
import HueControl from "./views/components/HueControl.vue";
import ModeControl from "./views/components/ModeControl.vue";
import ControlsPage from "./views/controls/Controls.page.vue";
import FeedbackPage from "./views/feedback/Feedback.page.vue";
import InputsPage from "./views/inputs/Inputs.page.vue";
import NavigationPage from "./views/navigation/Navigation.page.vue";
import OverlaysPage from "./views/overlays/Overlays.page.vue";
import SelectsPage from "./views/selects/Selects.page.vue";
import TagsPage from "./views/tags/Tags.page.vue";
import TokensPage from "./views/tokens/Tokens.page.vue";

/** 新增分类或公共组件时同步 count；顶部分类由 FilterTabs 自举。 */
const PAGES = [
  { key: "tokens", label: "设计 token", count: 0, component: TokensPage },
  { key: "buttons", label: "按钮", count: 4, component: ButtonsPage },
  { key: "controls", label: "控件", count: 3, component: ControlsPage },
  { key: "inputs", label: "输入框", count: 6, component: InputsPage },
  { key: "selects", label: "选择器", count: 3, component: SelectsPage },
  { key: "navigation", label: "导航", count: 2, component: NavigationPage },
  { key: "cards", label: "卡片", count: 1, component: CardsPage },
  { key: "tags", label: "标签", count: 1, component: TagsPage },
  { key: "feedback", label: "反馈", count: 3, component: FeedbackPage },
  { key: "overlays", label: "浮层", count: 12, component: OverlaysPage },
] as const;

type PageKey = (typeof PAGES)[number]["key"];

const PAGE_OPTIONS = PAGES.map(({ key, label, count }) => ({
  value: key,
  label,
  count,
})) satisfies readonly FilterTabOption[];

const activeKey = ref<PageKey>("tokens");
const activePage = () => PAGES.find((page) => page.key === activeKey.value)!.component;

const setActivePage = (value: FilterTabValue) => {
  const page = PAGES.find((candidate) => Object.is(candidate.key, value));
  if (page) activeKey.value = page.key;
};
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

        <!-- 展示站直接使用自身的分类筛选；count 是每类文档化的公共组件入口数。 -->
        <div class="mt-10 border-b border-border/40 pb-3">
          <FilterTabs
            :model-value="activeKey"
            :options="PAGE_OPTIONS"
            label="组件预览分类"
            class="-mb-4"
            @update:model-value="setActivePage"
          />
        </div>
      </header>

      <main class="mt-10">
        <component :is="activePage()" />
      </main>
    </div>
  </div>
</template>
