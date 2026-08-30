<script setup lang="ts">
import type { HTMLAttributes } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    rootClass?: HTMLAttributes["class"];
    rootStyle?: HTMLAttributes["style"];
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
  }>(),
  {
    rootClass: undefined,
    rootStyle: undefined,
    disabled: false,
    readonly: false,
    invalid: false,
  },
);

defineSlots<{
  default(): unknown;
  prefix?(): unknown;
  suffix?(): unknown;
}>();
</script>

<template>
  <div
    v-bind="$attrs"
    :class="[
      'flex w-full items-center overflow-hidden rounded-xl border border-transparent bg-bg-muted text-fg transition-shadow',
      props.disabled ? 'cursor-not-allowed opacity-60' : '',
      props.readonly && !props.disabled ? 'cursor-text' : '',
      props.invalid ? 'ring-2 ring-danger' : 'focus-within:ring-2 focus-within:ring-accent/30',
      props.rootClass,
    ]"
    :style="props.rootStyle"
  >
    <slot name="prefix" />
    <slot />
    <slot name="suffix" />
  </div>
</template>
