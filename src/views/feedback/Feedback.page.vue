<!-- src/views/feedback/Feedback.page.vue -->
<script setup lang="ts">
import { Users } from "@lucide/vue";

import ButtonSecondary from "@/components/button/ButtonSecondary.vue";
import EmptyState from "@/components/feedback/EmptyState.vue";
import Loading from "@/components/feedback/Loading.vue";

import ApiTable from "../components/ApiTable.vue";
import ComponentDocsSection from "../components/ComponentDocsSection.vue";
import SpecimenCase from "../components/SpecimenCase.vue";
import SpecimenPair from "../components/SpecimenPair.vue";

const LOADING_API = [
  [
    "class / style / 原生 SVG 属性",
    "透传",
    "未传",
    "作用于根 SVG；尺寸取 1em，颜色取 currentColor",
  ],
  ["props / slots / events", "—", "—", "无；状态文案由调用方在外层提供"],
] as const;

const EMPTY_STATE_API = [
  ["text", "string", "必填", "空态说明；翻译和业务措辞由调用方负责"],
  ["class / style / 原生属性", "透传", "未传", "作用于根 div，可传 role / aria-live"],
  ["#icon", "slot", "内置 Inbox", "装饰图标；包装层固定 aria-hidden"],
  ["#action", "slot", "未传", "文案下方的下一步引导操作"],
  ["events", "—", "—", "无"],
] as const;
</script>

<template>
  <div>
    <p class="max-w-xl text-sm/6 text-fg-muted">
      反馈组件只负责表达状态，不决定业务文案和后续动作。Loading 跟随排版上下文，EmptyState 保留
      ohmyblog 的虚线容器和低强调层级。
    </p>

    <ComponentDocsSection title="Loading" class="mt-10">
      <template #description>
        尺寸取 1em、颜色取 currentColor。图形本身是装饰性的；需要宣告加载状态时，由调用方提供 role
        和可读文本。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="尺寸与颜色" class="mt-4">
          <div class="flex items-center gap-5">
            <span class="text-sm text-fg"><Loading /></span>
            <span class="text-xl text-fg-subtle"><Loading /></span>
            <span class="text-3xl text-accent"><Loading /></span>
          </div>
        </SpecimenCase>

        <SpecimenCase label="可访问的状态包装" class="mt-5">
          <div role="status" class="inline-flex items-center gap-2 text-sm text-fg-muted">
            <Loading />
            <span>正在加载文章</span>
          </div>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="Loading API" :rows="LOADING_API" />
    </ComponentDocsSection>

    <ComponentDocsSection title="EmptyState" class="mt-16">
      <template #description>
        默认只渲染图标与说明；icon 和 action 都是明确插槽。组件不内置
        i18n，也不假设页面上存在“添加”按钮。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="默认图标" class="mt-4">
          <EmptyState text="暂无文章" />
        </SpecimenCase>

        <SpecimenCase label="自定义图标" class="mt-5">
          <EmptyState text="暂无友链，成为第一个！">
            <template #icon>
              <Users aria-hidden="true" class="size-8" />
            </template>
          </EmptyState>
        </SpecimenCase>

        <SpecimenCase label="长文案" class="mt-5">
          <EmptyState text="当前筛选条件下没有匹配的内容，可以尝试清除筛选条件后重新查看。" />
        </SpecimenCase>

        <SpecimenCase label="引导操作" class="mt-5">
          <EmptyState text="还没有文章，从第一篇开始。">
            <template #action>
              <ButtonSecondary text="创建第一篇文章" />
            </template>
          </EmptyState>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="EmptyState Props and Slots" :rows="EMPTY_STATE_API" />
    </ComponentDocsSection>
  </div>
</template>
