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
  tertiary-button relative inline-flex cursor-pointer items-center gap-2 whitespace-nowrap
  rounded-md bg-transparent px-2.5 py-2 text-sm leading-tight
  disabled:cursor-not-allowed
`;
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :aria-pressed="props.isActive"
    :class="[
      BASE,
      props.isActive && 'tertiary-button--active',
      props.danger
        ? 'text-danger/80 enabled:hover:text-danger enabled:focus-visible:text-danger'
        : props.isActive
          ? 'text-fg'
          : 'text-fg-muted enabled:hover:text-fg enabled:focus-visible:text-fg',
    ]"
  >
    <span
      class="tertiary-rail relative h-3.5 w-0.5 shrink-0 overflow-hidden rounded-full bg-border/60"
      aria-hidden="true"
    >
      <span
        class="tertiary-rail-accent absolute inset-0 rounded-full"
        :class="props.danger ? 'bg-danger' : 'bg-accent'"
      ></span>
    </span>
    <span>{{ props.text }}</span>
  </button>
</template>

<style scoped>
.tertiary-button,
.tertiary-rail-accent {
  transition-duration: var(--default-transition-duration, 200ms);
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
}

.tertiary-button {
  transition-property: opacity, transform;
}

.tertiary-rail-accent {
  opacity: 0;
  transform: scaleY(0.35);
  transform-origin: center;
  transition-property: opacity, transform;
}

.tertiary-button--active .tertiary-rail-accent,
.tertiary-button:enabled:hover .tertiary-rail-accent,
.tertiary-button:focus-visible .tertiary-rail-accent {
  opacity: 1;
  transform: scaleY(1);
}

.tertiary-button:enabled:active {
  transform: translateY(1px);
}

.tertiary-button:enabled:active .tertiary-rail-accent {
  transform: scaleY(0.65);
}

.tertiary-button:focus {
  outline: none;
}

.tertiary-button:focus-visible {
  outline: 2px solid var(--theme-fg);
  outline-offset: 2px;
}

.tertiary-button:disabled {
  color: var(--theme-fg-muted);
}

.tertiary-button:disabled .tertiary-rail {
  opacity: 0.45;
}

@media (prefers-reduced-motion: reduce) {
  .tertiary-button,
  .tertiary-rail-accent {
    transition: none;
  }

  .tertiary-button:enabled:active {
    transform: none;
  }
}
</style>
