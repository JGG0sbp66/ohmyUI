<!-- src/components/input/InputNumber.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";

import type { InputNumberProps, ReadonlyCopyEmits } from "./input.types";
import InputControlFrame from "./internal/InputControlFrame.vue";
import { selectAndCopyReadonlyControl } from "./internal/readonly-copy";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<InputNumberProps>(), {
  class: undefined,
  style: undefined,
  min: undefined,
  max: undefined,
  step: 1,
  disabled: false,
  readonly: false,
  copyOnClick: false,
  required: false,
  invalid: false,
  inputClass: undefined,
});

const emit = defineEmits<ReadonlyCopyEmits>();

const model = defineModel<number | null>({ default: null });

const formatModelValue = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? String(value) : "";

const draft = ref(formatModelValue(model.value));
const focused = ref(false);
let lastEmittedValue: number | null | undefined;

watch(model, (value) => {
  if (focused.value && Object.is(value, lastEmittedValue)) {
    lastEmittedValue = undefined;
    return;
  }

  lastEmittedValue = undefined;
  draft.value = formatModelValue(value);
});

const handleInput = (event: Event) => {
  const input = event.target as HTMLInputElement;

  // 例如负号或尚未完成的小数：保留浏览器草稿，不用无效值覆盖外部模型。
  if (input.validity.badInput) return;

  const nextValue = input.value === "" ? null : input.valueAsNumber;
  if (nextValue !== null && !Number.isFinite(nextValue)) return;

  draft.value = input.value;
  lastEmittedValue = nextValue;
  model.value = nextValue;
};

const handleFocus = () => {
  focused.value = true;
};

const handleBlur = () => {
  focused.value = false;
  lastEmittedValue = undefined;
  draft.value = formatModelValue(model.value);
};

const handleReadonlyClick = (event: MouseEvent) => {
  if (!props.readonly || !props.copyOnClick || props.disabled) return;

  void selectAndCopyReadonlyControl(event, {
    onSuccess: (value) => emit("copy-success", value),
    onError: (error) => emit("copy-error", error),
  });
};
</script>

<template>
  <InputControlFrame
    :root-class="props.class"
    :root-style="props.style"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :invalid="props.invalid"
  >
    <input
      v-bind="$attrs"
      :value="draft"
      type="number"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :required="props.required"
      :aria-invalid="props.invalid ? 'true' : undefined"
      :class="[
        'min-h-10 w-full bg-transparent px-4 py-2.5 text-sm font-medium outline-none placeholder:text-fg-soft',
        props.disabled ? 'cursor-not-allowed' : '',
        props.readonly && !props.disabled && props.copyOnClick ? 'cursor-copy select-all' : '',
        props.readonly && !props.disabled && !props.copyOnClick ? 'cursor-text' : '',
        props.inputClass,
      ]"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @click="handleReadonlyClick"
    />
  </InputControlFrame>
</template>
