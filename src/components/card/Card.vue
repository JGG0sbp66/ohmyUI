<!-- src/components/card/Card.vue -->
<script setup lang="ts">
defineOptions({ inheritAttrs: false });

type CardPadding = "none" | "sm" | "default";

interface Props {
  /**
   * 卡片内边距：none 无内边距，sm 为 1.5rem，default 为 2rem。
   * @default "default"
   */
  padding?: CardPadding;
}

const props = withDefaults(defineProps<Props>(), {
  padding: "default",
});

defineSlots<{
  default(): unknown;
}>();

const PADDING_CLASS: Record<CardPadding, string> = {
  none: "",
  sm: "p-6",
  default: "p-8",
};
</script>

<template>
  <div
    v-bind="$attrs"
    :class="['w-full rounded-3xl border border-border/60 bg-bg-card', PADDING_CLASS[props.padding]]"
  >
    <slot />
  </div>
</template>
