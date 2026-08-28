<!-- src/components/tag/Tag.vue -->
<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import type { TagSize, TagTone } from "./tag.types";

defineOptions({ inheritAttrs: false });

interface Props {
  /** 标签的语义颜色。 */
  tone?: TagTone;
  /** sm 用于紧凑列表，md 用于常规内容。 */
  size?: TagSize;
  /** 作用于唯一的标签根节点。 */
  class?: HTMLAttributes["class"];
  /** 作用于唯一的标签根节点。 */
  style?: HTMLAttributes["style"];
}

const props = withDefaults(defineProps<Props>(), {
  tone: "neutral",
  size: "sm",
  class: undefined,
  style: undefined,
});

defineSlots<{
  default(): unknown;
}>();

const TONE_CLASS: Record<TagTone, string> = {
  neutral: "bg-fg-subtle/10 text-fg-subtle",
  accent: "bg-accent/10 text-accent",
  danger: "bg-danger/10 text-danger",
};

const SIZE_CLASS: Record<TagSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-1 text-xs",
};
</script>

<template>
  <span
    v-bind="$attrs"
    :class="[
      'inline-flex w-fit shrink-0 items-center rounded-full font-medium',
      TONE_CLASS[props.tone],
      SIZE_CLASS[props.size],
      props.class,
    ]"
    :style="props.style"
  >
    <slot />
  </span>
</template>
