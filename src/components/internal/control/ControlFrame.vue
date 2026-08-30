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
      /*
        焦点环用不透明 accent，不用半透明。
        WCAG 2.2 SC 2.4.11 要求焦点指示器与两侧相邻颜色都 >= 3:1（外侧页面底色、
        内侧本框的 bg-muted 填充）。实测 hue 250：accent/30 只有 1.36:1（浅色）与
        1.27:1（深色），accent/40 也才 1.55:1，不透明 accent 是 3.39:1 与 4.93:1。
        半透明看着柔和，代价是接近隐形。
      */
      props.invalid ? 'ring-2 ring-danger' : 'focus-within:ring-2 focus-within:ring-accent',
      props.rootClass,
    ]"
    :style="props.rootStyle"
  >
    <slot name="prefix" />
    <slot />
    <slot name="suffix" />
  </div>
</template>
