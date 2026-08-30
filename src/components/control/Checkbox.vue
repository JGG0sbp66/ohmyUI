<!-- src/components/control/Checkbox.vue -->
<script setup lang="ts">
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
    class="group relative flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform duration-300 select-none enabled:active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
    @click="toggle"
  >
    <!-- 状态背景分层做透明度过渡，切换 hue 时不让旧颜色追着新颜色补间。 -->
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-full bg-bg-muted shadow-inner"
    />
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-full bg-bg-muted/80 opacity-0 transition-opacity duration-300 motion-reduce:transition-none"
      :class="!props.disabled ? 'group-hover:opacity-100' : ''"
    />
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-full bg-accent shadow-md transition-opacity duration-300 motion-reduce:transition-none"
      :class="model || props.indeterminate ? 'opacity-100' : 'opacity-0'"
    />

    <Transition
      mode="out-in"
      enter-active-class="transition-[opacity,transform] ease-out duration-200 motion-reduce:transition-none"
      enter-from-class="opacity-0 scale-50"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-[opacity,transform] ease-in duration-100 motion-reduce:transition-none"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-50"
    >
      <svg
        v-if="model && !props.indeterminate"
        key="check"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="relative h-3 w-3 text-white"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <svg
        v-else-if="props.indeterminate"
        key="minus"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="relative h-3 w-3 text-white"
      >
        <path d="M5 12h14" />
      </svg>
    </Transition>
  </button>
</template>
