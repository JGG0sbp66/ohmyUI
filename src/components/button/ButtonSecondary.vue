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
  根 button 保持稳定的布局盒与点击热区，方便 Popover 等浮层用它作为锚点。
  按压缩放只发生在 ::before 背景和内部视觉层，不再改变根元素的 DOMRect。
  宽高仍由上下文决定；过渡时长继续取 --default-transition-duration。
*/
const BASE = `
  group/secondary relative isolate cursor-pointer items-center overflow-hidden
  rounded-lg bg-transparent px-3 py-2 text-sm leading-tight
  before:absolute before:inset-0 before:-z-10 before:rounded-[inherit]
  before:bg-bg-muted before:content-[''] before:transition-[opacity,scale]
  enabled:active:before:scale-90 enabled:active:before:opacity-80
  disabled:cursor-not-allowed disabled:text-fg-muted disabled:opacity-50
  disabled:before:opacity-0
`;

const VISUAL = `
  flex min-w-0 items-center gap-2 transition-[opacity,scale]
  group-enabled/secondary:group-active/secondary:scale-90
  group-enabled/secondary:group-active/secondary:opacity-80
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
    <span
      :class="[
        VISUAL,
        props.block ? 'w-full' : '',
        props.align === 'start' ? 'justify-start' : 'justify-center',
      ]"
    >
      <slot></slot>
      <span class="min-w-0 truncate">{{ props.text }}</span>
      <span v-if="isFilled(slots.suffix)" class="ml-auto shrink-0">
        <slot name="suffix"></slot>
      </span>
    </span>
  </button>
</template>
