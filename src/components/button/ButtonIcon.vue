<!-- src/components/button/ButtonIcon.vue -->
<script lang="ts" setup>
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** 无障碍名称。图标按钮没有可见文字，读屏器只能靠它，必填 */
    label: string;
    isActive?: boolean;
    disabled?: boolean;
  }>(),
  { isActive: false, disabled: false },
);

/*
  aspect-square 保证 1:1：宽度由图标 + 内边距撑开，高度等于宽度，
  塞进来的图标不是正方形也不影响。要精确尺寸时调用方传 size-8，
  组件不输出宽高，所以能干净覆盖，不需要 !。

  视觉语言与 ButtonSecondary 一致：::before 作为可独立缩放的背景层，
  isolate + -z-10 让它沉到图标之下。过渡内置，时长取 --default-transition-duration。
*/
const BASE = `
  relative isolate inline-flex aspect-square cursor-pointer items-center justify-center
  overflow-hidden rounded-lg bg-transparent p-1.5
  transition-[opacity,scale]
  before:absolute before:inset-0 before:-z-10 before:rounded-[inherit]
  before:bg-bg-muted before:content-[''] before:transition-[opacity,scale]
  enabled:active:scale-90 enabled:active:opacity-80
  disabled:cursor-not-allowed disabled:text-fg-muted disabled:opacity-50
  disabled:before:opacity-0
`;

/** 激活是 prop，只能在 JS 里分支；禁用交给 :disabled 伪类 */
const stateClass = computed(() =>
  props.isActive
    ? "text-fg-subtle before:scale-100 before:opacity-100"
    : "text-fg before:scale-90 before:opacity-0 enabled:hover:text-fg-subtle enabled:hover:before:scale-100 enabled:hover:before:opacity-100",
);
</script>

<template>
  <button
    type="button"
    :disabled="props.disabled"
    :aria-label="props.label"
    :class="[BASE, stateClass]"
  >
    <slot></slot>
  </button>
</template>
