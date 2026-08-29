<!-- src/components/input/InputText.vue -->
<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import InputControlFrame from "./internal/InputControlFrame.vue";
import { selectAndCopyReadonlyControl } from "./internal/readonly-copy";

defineOptions({ inheritAttrs: false });

type InputType = "text" | "email" | "password" | "search" | "tel" | "url";

interface Props {
  /** 调用方 class 作用于完整输入框外壳，而不是内部原生 input。 */
  class?: HTMLAttributes["class"];
  /** 调用方 style 作用于完整输入框外壳。 */
  style?: HTMLAttributes["style"];
  /** 文本型原生 input 类型；数值输入后续由独立组件处理。 */
  type?: InputType;
  disabled?: boolean;
  readonly?: boolean;
  /** 仅在 readonly 时，点击会全选并尝试复制当前展示值。 */
  copyOnClick?: boolean;
  required?: boolean;
  /** 只控制错误视觉与 aria-invalid；错误文案由 InputField 渲染。 */
  invalid?: boolean;
  /** 需要直接调整原生 input 时使用。 */
  inputClass?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
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

const emit = defineEmits<{
  "copy-success": [value: string];
  "copy-error": [error: unknown];
}>();

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
