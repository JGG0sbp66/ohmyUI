<!-- src/components/control/Switch.vue -->
<script setup lang="ts">
import type { HTMLAttributes } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 无可见文字控件的无障碍名称 */
    label: string;
    disabled?: boolean;
    /** 作用于最外层 label */
    class?: HTMLAttributes["class"];
    /** 作用于最外层 label */
    style?: HTMLAttributes["style"];
  }>(),
  { disabled: false, class: undefined, style: undefined },
);

const model = defineModel<boolean>({ default: false });
</script>

<template>
  <label
    :class="[
      'relative inline-flex items-center',
      props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      props.class,
    ]"
    :style="props.style"
  >
    <input
      v-bind="$attrs"
      v-model="model"
      type="checkbox"
      role="switch"
      :aria-label="props.label"
      :disabled="props.disabled"
      class="peer sr-only"
    />

    <!-- 关闭态轨道负责布局；开启态独立淡入，避免主题 hue 变化被 transition-colors 拖慢。 -->
    <span
      aria-hidden="true"
      class="h-7 w-12 rounded-full bg-fg-subtle/20 transition-[box-shadow] peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg"
    />
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-full bg-accent opacity-0 transition-opacity peer-checked:opacity-100"
    />
    <span
      aria-hidden="true"
      class="pointer-events-none absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-5"
    />
  </label>
</template>
