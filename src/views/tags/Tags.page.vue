<!-- src/views/tags/Tags.page.vue -->
<script setup lang="ts">
import Tag from "@/components/tag/Tag.vue";

import ApiTable from "../components/ApiTable.vue";
import ComponentDocsSection from "../components/ComponentDocsSection.vue";
import SpecimenCase from "../components/SpecimenCase.vue";
import SpecimenPair from "../components/SpecimenPair.vue";

const TAG_API = [
  ["tone", '"neutral" | "accent" | "danger"', '"neutral"', "标签的语义颜色"],
  ["size", '"sm" | "md"', '"sm"', "紧凑列表或常规内容尺寸"],
  ["class / style / 原生属性", "透传", "未传", "作用于唯一的 span 根节点"],
  ["#default", "slot", "必填", "标签内容，可放文字或自定义组合"],
] as const;
</script>

<template>
  <div>
    <p class="max-w-xl text-sm/6 text-fg-muted">
      Tag 是非交互式状态标记。颜色由语义 tone
      控制，尺寸由使用场景决定；需要点击或关闭行为时，应使用对应的交互组件，而不是给 Tag
      隐式增加按钮职责。
    </p>

    <ComponentDocsSection title="Tag" class="mt-10">
      <template #description>
        neutral 用于普通分类，accent 表示当前主题下的强调状态，danger 用于风险或破坏性状态。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="sm · 紧凑列表" class="mt-4">
          <div class="flex flex-wrap items-center gap-2">
            <Tag>草稿</Tag>
            <Tag tone="accent">已发布</Tag>
            <Tag tone="danger">待删除</Tag>
          </div>
        </SpecimenCase>

        <SpecimenCase label="md · 常规内容" class="mt-5">
          <div class="flex flex-wrap items-center gap-2">
            <Tag size="md">默认</Tag>
            <Tag tone="accent" size="md">推荐</Tag>
            <Tag tone="danger" size="md">高风险</Tag>
          </div>
        </SpecimenCase>

        <SpecimenCase label="原生属性与内容组合" class="mt-5">
          <div class="flex flex-wrap items-center gap-2">
            <Tag tone="accent" title="当前版本">
              <span class="mr-1 size-1.5 rounded-full bg-current" aria-hidden="true" />
              v1.0
            </Tag>
          </div>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="Tag Props and Slots" :rows="TAG_API" />
    </ComponentDocsSection>
  </div>
</template>
