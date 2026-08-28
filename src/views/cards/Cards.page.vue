<!-- src/views/cards/Cards.page.vue -->
<script setup lang="ts">
import Card from "@/components/card/Card.vue";

import ApiTable from "../components/ApiTable.vue";
import ComponentDocsSection from "../components/ComponentDocsSection.vue";
import SpecimenCase from "../components/SpecimenCase.vue";
import SpecimenPair from "../components/SpecimenPair.vue";

const CARD_API = [
  ["padding", '"none" | "sm" | "default"', '"default"', "none / 1.5rem / 2rem"],
  [
    "class / style / 原生属性",
    "透传",
    "未传",
    "作用于唯一的卡片根节点，可按场景显式添加阴影等样式",
  ],
  ["#default", "slot", "必填", "卡片内容；结构与布局由调用方决定"],
] as const;
</script>

<template>
  <div>
    <p class="max-w-xl text-sm/6 text-fg-muted">
      Card 是静态内容容器，只提供统一背景、圆角、边界与可选内边距。默认不制造悬浮层级；Dialog
      仅与它共享主题 token，不会在内部嵌套 Card。
    </p>

    <ComponentDocsSection title="Card" class="mt-10">
      <template #description>
        默认以
        <code class="font-mono text-fg">rounded-3xl</code>
        和
        <code class="font-mono text-fg">border-border/60</code>
        建立安静而明确的内容边界，
        <code class="font-mono text-fg">bg-bg-card</code>
        负责主题下的层级对比。阴影不属于基础外观，需要强调悬浮关系时由调用方显式添加。
      </template>

      <SpecimenPair frame="canvas" class="mt-6">
        <SpecimenCase label="default · p-8" class="mt-4">
          <Card>
            <p class="text-sm font-semibold text-fg">文章概览</p>
            <p class="mt-2 text-xs/5 text-fg-muted">
              默认卡片保留 2rem 内边距，并以轻边界安静地区分内容层级。
            </p>
          </Card>
        </SpecimenCase>

        <SpecimenCase label="sm · p-6" class="mt-5">
          <Card padding="sm">
            <p class="text-sm font-semibold text-fg">紧凑设置</p>
            <p class="mt-2 text-xs/5 text-fg-muted">较紧凑的 1.5rem 内边距。</p>
          </Card>
        </SpecimenCase>

        <SpecimenCase label="none · 自定义分区" class="mt-5">
          <Card padding="none" class="overflow-hidden">
            <div class="bg-accent/10 px-6 py-4 text-sm font-semibold text-accent">无内边距卡片</div>
            <p class="px-6 py-5 text-xs/5 text-fg-muted">
              padding=none 只移除内边距，调用方可自行组织分区。
            </p>
          </Card>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="Card Props and Slots" :rows="CARD_API" />
    </ComponentDocsSection>
  </div>
</template>
