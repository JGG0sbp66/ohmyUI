<script setup lang="ts">
import type { SelectionDensity } from "./selection.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    active?: boolean;
    selected?: boolean;
    disabled?: boolean;
    density?: SelectionDensity;
  }>(),
  {
    active: false,
    selected: false,
    disabled: false,
    density: "compact",
  },
);

defineSlots<{
  default(): unknown;
  indicator?(props: { selected: boolean }): unknown;
}>();
</script>

<template>
  <div
    v-bind="$attrs"
    :class="[
      'relative isolate flex w-full items-center justify-start gap-2.5 overflow-hidden rounded-lg bg-transparent text-left text-sm outline-none select-none',
      'before:absolute before:inset-0 before:-z-10 before:scale-90 before:rounded-[inherit] before:bg-bg-muted before:opacity-0 before:transition-[opacity,scale] before:content-[\'\']',
      props.density === 'touch' ? 'min-h-11 px-3 py-2' : 'min-h-10 px-2.5 py-2',
      props.active || props.selected
        ? 'text-fg-subtle before:scale-100 before:opacity-100'
        : 'text-fg',
      props.disabled
        ? 'cursor-not-allowed text-fg-muted opacity-50'
        : 'cursor-pointer transition-[opacity,scale] active:scale-90 active:opacity-80',
    ]"
  >
    <slot />
    <slot name="indicator" :selected="props.selected">
      <svg
        v-if="props.selected"
        class="size-4 shrink-0 text-accent"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m5 12 4 4L19 6" />
      </svg>
    </slot>
  </div>
</template>
