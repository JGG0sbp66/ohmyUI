<!-- src/components/control/Checkbox.vue -->
<script setup lang="ts">
import { Check, Minus } from "@lucide/vue";

const props = withDefaults(
  defineProps<{
    /** 无可见文字控件的无障碍名称 */
    label: string;
    /** 半选状态优先于 modelValue 展示，但不改变 modelValue */
    indeterminate?: boolean;
    disabled?: boolean;
  }>(),
  { indeterminate: false, disabled: false },
);

const model = defineModel<boolean>({ default: false });

const toggle = () => {
  if (props.disabled) return;
  model.value = !model.value;
};
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-label="props.label"
    :aria-checked="props.indeterminate ? 'mixed' : model"
    :disabled="props.disabled"
    class="group relative flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full transition-[scale,box-shadow] select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg focus:ring-accent enabled:active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
    @click="toggle"
  >
    <!-- 状态背景分层做透明度过渡，切换 hue 时不让旧颜色追着新颜色补间。 -->
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-full bg-bg-muted shadow-inner"
    />
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-full bg-bg-muted/80 opacity-0 transition-opacity"
      :class="!props.disabled ? 'group-hover:opacity-100' : ''"
    />
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-full bg-accent shadow-md transition-opacity"
      :class="model || props.indeterminate ? 'opacity-100' : 'opacity-0'"
    />

    <Transition
      mode="out-in"
      enter-active-class="transition-[opacity,scale] ease-out"
      enter-from-class="opacity-0 scale-50"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-[opacity,scale] ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-50"
    >
      <Check
        v-if="model && !props.indeterminate"
        key="check"
        aria-hidden="true"
        class="relative h-3 w-3 text-white"
        :stroke-width="4"
      />
      <Minus
        v-else-if="props.indeterminate"
        key="minus"
        aria-hidden="true"
        class="relative h-3 w-3 text-white"
        :stroke-width="4"
      />
    </Transition>
  </button>
</template>
