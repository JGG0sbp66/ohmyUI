<!-- src/components/button/ButtonSecondary.vue -->
<script lang="ts" setup>
import { Comment, computed, useSlots, type Slot } from "vue";

const props = withDefaults(
  defineProps<{
    /** 纯图标场景请用 ButtonIcon，本组件必须有文字 */
    text: string;
    isActive?: boolean;
    disabled?: boolean;
    /** 撑满父容器宽度 */
    block?: boolean;
    /** 菜单项一类需要 start */
    align?: "center" | "start";
  }>(),
  { isActive: false, disabled: false, block: false, align: "center" },
);

const slots = useSlots();

/** 父组件 v-if 未命中时插槽仍返回注释占位节点，直接判断 slot 是否存在会误判 */
function isFilled(slot?: Slot): boolean {
  return slot?.().some((vnode) => vnode.type !== Comment) ?? false;
}

/*
  只输出内在样式，不输出宽高 —— 宽高由上下文决定，留给调用方传 h-10 / flex-1 等。
  isolate + before:-z-10 让背景层沉到内容之下，子元素不必加定位类。
  过渡内置，不依赖全局基线；时长取 --default-transition-duration。
*/
const BASE = `
  relative isolate cursor-pointer items-center gap-2 overflow-hidden
  rounded-lg bg-transparent px-3 py-2 text-sm leading-tight
  transition-[color,opacity,scale]
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
    :class="[
      BASE,
      stateClass,
      props.block ? 'flex w-full' : 'inline-flex',
      props.align === 'start' ? 'justify-start' : 'justify-center',
    ]"
  >
    <slot></slot>
    <span>{{ props.text }}</span>
    <span v-if="isFilled(slots.suffix)" class="ml-auto">
      <slot name="suffix"></slot>
    </span>
  </button>
</template>
