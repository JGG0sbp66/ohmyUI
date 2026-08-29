<!-- src/components/input/InputTextarea.vue -->
<script setup lang="ts">
import type { InputTextareaProps, ReadonlyCopyEmits } from "./input.types";
import InputControlFrame from "./internal/InputControlFrame.vue";
import { selectAndCopyReadonlyControl } from "./internal/readonly-copy";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<InputTextareaProps>(), {
  class: undefined,
  style: undefined,
  rows: 4,
  resize: "none",
  disabled: false,
  readonly: false,
  copyOnClick: false,
  required: false,
  invalid: false,
  textareaClass: undefined,
});

const emit = defineEmits<ReadonlyCopyEmits>();

const model = defineModel<string>({ default: "" });

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
    <textarea
      v-bind="$attrs"
      v-model="model"
      :rows="props.rows"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :required="props.required"
      :aria-invalid="props.invalid ? 'true' : undefined"
      :class="[
        'min-h-10 w-full bg-transparent px-4 py-2.5 text-sm leading-relaxed font-medium outline-none placeholder:text-fg-soft',
        props.resize === 'vertical' ? 'resize-y' : 'resize-none',
        props.disabled ? 'cursor-not-allowed' : '',
        props.readonly && !props.disabled && props.copyOnClick ? 'cursor-copy select-all' : '',
        props.readonly && !props.disabled && !props.copyOnClick ? 'cursor-text' : '',
        props.textareaClass,
      ]"
      @click="handleReadonlyClick"
    />
  </InputControlFrame>
</template>
