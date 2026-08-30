<!-- src/components/input/internal/InputControlFrame.vue -->
<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import ControlFrame from "../../internal/control/ControlFrame.vue";

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
  <ControlFrame
    v-bind="$attrs"
    :root-class="props.rootClass"
    :root-style="props.rootStyle"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :invalid="props.invalid"
  >
    <template #prefix><slot name="prefix" /></template>
    <slot />
    <template #suffix><slot name="suffix" /></template>
  </ControlFrame>
</template>
