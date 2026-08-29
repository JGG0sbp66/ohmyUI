<!-- src/components/input/InputNumber.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import type { HTMLAttributes } from "vue";

import InputControlFrame from "./internal/InputControlFrame.vue";
import { selectAndCopyReadonlyControl } from "./internal/readonly-copy";

defineOptions({ inheritAttrs: false });

type NumberStep = number | "any";

interface Props {
  /** 调用方 class 作用于完整输入框外壳，而不是内部原生 input。 */
  class?: HTMLAttributes["class"];
  /** 调用方 style 作用于完整输入框外壳。 */
  style?: HTMLAttributes["style"];
  min?: number;
  max?: number;
  step?: NumberStep;
  disabled?: boolean;
  readonly?: boolean;
  /** 仅在 readonly 时，点击会尝试复制当前展示值。 */
  copyOnClick?: boolean;
  required?: boolean;
  /** 只控制错误视觉与 aria-invalid；范围错误文案由调用方决定。 */
  invalid?: boolean;
  /** 需要直接调整原生 input 时使用。 */
  inputClass?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
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

const emit = defineEmits<{
  "copy-success": [value: string];
  "copy-error": [error: unknown];
}>();

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
