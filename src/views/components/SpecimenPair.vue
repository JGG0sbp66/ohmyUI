<!-- src/views/components/SpecimenPair.vue -->
<!-- 预览用：浅深并置。两栏 markup 相同，分别用 .light / .dark 锁定 token 值 -->
<script setup lang="ts">
import Card from "@/components/card/Card.vue";

type SpecimenFrame = "card" | "canvas";

interface Props {
  /** 默认使用 Card 自举；展示 Card 本身时改用独立测试画布，避免 Card 嵌套。 */
  frame?: SpecimenFrame;
}

const props = withDefaults(defineProps<Props>(), {
  frame: "card",
});

defineSlots<{
  default(props: { tone: "light" | "dark" }): unknown;
}>();

const MODES = [
  { label: ".light（浅色）", scope: "light", tone: "light" as const },
  { label: ".dark（深色）", scope: "dark", tone: "dark" as const },
];
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <article v-for="mode in MODES" :key="mode.tone" :class="mode.scope">
      <component
        :is="props.frame === 'card' ? Card : 'div'"
        :padding="props.frame === 'card' ? 'sm' : undefined"
        :class="[
          'h-full',
          props.frame === 'canvas'
            ? 'rounded-3xl border border-dashed border-border/60 bg-bg p-6'
            : undefined,
        ]"
      >
        <h3 class="font-mono text-xs text-fg-muted">{{ mode.label }}</h3>
        <slot :tone="mode.tone"></slot>
      </component>
    </article>
  </div>
</template>
