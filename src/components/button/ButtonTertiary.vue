<!-- src/components/button/ButtonTertiary.vue -->
<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    text: string;
    disabled?: boolean;
    /** 可选切换态；传入时同步输出 aria-pressed */
    isActive?: boolean;
    /** 低强调破坏性操作：移除、清除单项 */
    danger?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  { disabled: false, danger: false, type: "button" },
);

/*
  第三级动作不生成按钮面：中性短轨提供常驻 affordance，强调色短轨只通过
  opacity / scale 出现。颜色本身不参与 transition，因此全局 hue 仍然同帧更新。
  尺寸继续由内容与内边距决定，调用方可直接补 h-* / min-w-*。
*/
const BASE = `
  group/tertiary relative inline-flex cursor-pointer items-center gap-2 whitespace-nowrap
  rounded-md bg-transparent px-2.5 py-2 text-sm leading-tight
  transition-[opacity,translate] ease-[cubic-bezier(0.2,0,0,1)]
  focus:outline-none focus-visible:outline-2 focus-visible:outline-solid
  focus-visible:outline-offset-2 focus-visible:outline-fg
  motion-safe:enabled:active:translate-y-px motion-reduce:transition-none
  disabled:cursor-not-allowed disabled:text-fg-muted
`;

const RAIL_ACCENT = `
  absolute inset-0 origin-center rounded-full
  transition-[opacity,scale] ease-[cubic-bezier(0.2,0,0,1)]
  group-enabled/tertiary:group-hover/tertiary:scale-y-100
  group-enabled/tertiary:group-hover/tertiary:opacity-100
  group-focus-visible/tertiary:scale-y-100 group-focus-visible/tertiary:opacity-100
  motion-safe:group-enabled/tertiary:group-active/tertiary:scale-y-[0.65]
  motion-reduce:transition-none
`;
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :aria-pressed="props.isActive"
    :class="[
      BASE,
      props.danger
        ? 'text-danger/80 enabled:hover:text-danger enabled:focus-visible:text-danger'
        : props.isActive
          ? 'text-fg'
          : 'text-fg-muted enabled:hover:text-fg enabled:focus-visible:text-fg',
    ]"
  >
    <span
      class="relative h-3.5 w-0.5 shrink-0 overflow-hidden rounded-full bg-border/60 group-disabled/tertiary:opacity-[0.45]"
      aria-hidden="true"
    >
      <span
        :class="[
          RAIL_ACCENT,
          props.isActive ? 'scale-y-100 opacity-100' : 'scale-y-[0.35] opacity-0',
          props.danger ? 'bg-danger' : 'bg-accent',
        ]"
      ></span>
    </span>
    <span>{{ props.text }}</span>
  </button>
</template>
