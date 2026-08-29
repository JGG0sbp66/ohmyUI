<!-- src/components/input/InputText.vue -->
<script setup lang="ts">
import type { InputTextProps, ReadonlyCopyEmits } from "./input.types";
import InputControlFrame from "./internal/InputControlFrame.vue";
import { selectAndCopyReadonlyControl } from "./internal/readonly-copy";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<InputTextProps>(), {
  class: undefined,
  style: undefined,
  type: "text",
  disabled: false,
  readonly: false,
  copyOnClick: false,
  required: false,
  invalid: false,
  inputClass: undefined,
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
    <template #prefix>
      <slot name="prefix" />
    </template>

    <input
      v-bind="$attrs"
      v-model="model"
      :type="props.type"
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
      @click="handleReadonlyClick"
    />

    <template #suffix>
      <slot name="suffix" />
    </template>
  </InputControlFrame>
</template>
