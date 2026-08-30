<!-- src/components/control/SegmentedControl.vue -->
<script setup lang="ts" generic="T extends SegmentedControlValue">
import { computed } from "vue";

import type { SegmentedControlOption, SegmentedControlValue } from "./control.types";

const props = withDefaults(
  defineProps<{
    /** 当前选中的值 */
    modelValue: T;
    /** 等宽选项列表，value 必须唯一 */
    options: readonly SegmentedControlOption<T>[];
    /** 整组控件的无障碍名称 */
    label: string;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{
  "update:modelValue": [value: T];
}>();

const selectedIndex = computed(() =>
  props.options.findIndex((option) => option.value === props.modelValue),
);

const firstEnabledIndex = computed(() =>
  props.disabled ? -1 : props.options.findIndex((option) => !option.disabled),
);

const tabStopIndex = computed(() => {
  const selected = props.options[selectedIndex.value];
  if (selected && !props.disabled && !selected.disabled) return selectedIndex.value;
  return firstEnabledIndex.value;
});

const indicatorStyle = computed(() => {
  if (props.options.length === 0 || selectedIndex.value < 0) return undefined;

  return {
    width: `calc((100% - 8px) / ${props.options.length})`,
    transform: `translateX(${selectedIndex.value * 100}%)`,
  };
});

const optionKey = (option: SegmentedControlOption<T>, index: number) =>
  `${typeof option.value}:${String(option.value)}:${index}`;

const selectOption = (option: SegmentedControlOption<T>) => {
  if (props.disabled || option.disabled) return;
  emit("update:modelValue", option.value);
};

const findEnabledIndex = (from: number, direction: 1 | -1) => {
  const count = props.options.length;
  if (count === 0 || props.disabled) return undefined;

  for (let offset = 1; offset <= count; offset += 1) {
    const index = (from + offset * direction + count) % count;
    if (!props.options[index]?.disabled) return index;
  }

  return undefined;
};

const edgeEnabledIndex = (edge: "first" | "last") => {
  if (props.disabled) return undefined;

  if (edge === "first") {
    const index = props.options.findIndex((option) => !option.disabled);
    return index >= 0 ? index : undefined;
  }

  for (let index = props.options.length - 1; index >= 0; index -= 1) {
    if (!props.options[index]?.disabled) return index;
  }

  return undefined;
};

const focusOption = (event: KeyboardEvent, index: number) => {
  const root = (event.currentTarget as HTMLElement | null)?.parentElement;
  root?.querySelector<HTMLButtonElement>(`[data-option-index="${index}"]`)?.focus();
};

const handleKeydown = (event: KeyboardEvent, index: number) => {
  let nextIndex: number | undefined;

  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown":
      nextIndex = findEnabledIndex(index, 1);
      break;
    case "ArrowLeft":
    case "ArrowUp":
      nextIndex = findEnabledIndex(index, -1);
      break;
    case "Home":
      nextIndex = edgeEnabledIndex("first");
      break;
    case "End":
      nextIndex = edgeEnabledIndex("last");
      break;
    default:
      return;
  }

  if (nextIndex === undefined) return;
  const option = props.options[nextIndex];
  if (!option) return;

  event.preventDefault();
  emit("update:modelValue", option.value);
  focusOption(event, nextIndex);
};
</script>

<template>
  <div
    role="radiogroup"
    aria-orientation="horizontal"
    :aria-label="props.label"
    :aria-disabled="props.disabled || undefined"
    class="relative flex rounded-xl border border-border/20 bg-bg-muted/60 p-1"
  >
    <div
      v-if="indicatorStyle"
      aria-hidden="true"
      class="absolute top-1 bottom-1 left-1 rounded-lg bg-bg-card shadow-sm ring-1 ring-border/50 transition-transform duration-200 ease-in-out motion-reduce:transition-none"
      :style="indicatorStyle"
    />

    <button
      v-for="(option, index) in props.options"
      :key="optionKey(option, index)"
      type="button"
      role="radio"
      :data-option-index="index"
      :aria-checked="props.modelValue === option.value"
      :disabled="props.disabled || option.disabled"
      :tabindex="index === tabStopIndex ? 0 : -1"
      class="relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors duration-200 enabled:hover:text-fg disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
      :class="props.modelValue === option.value ? 'text-fg' : 'text-fg-soft'"
      @click="selectOption(option)"
      @keydown="handleKeydown($event, index)"
    >
      <component
        :is="option.icon"
        v-if="option.icon"
        aria-hidden="true"
        class="shrink-0"
        :class="option.iconClass ?? 'h-3.5 w-auto'"
      />
      {{ option.label }}
    </button>
  </div>
</template>
