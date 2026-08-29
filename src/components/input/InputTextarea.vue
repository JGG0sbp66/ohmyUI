<!-- src/components/input/InputTextarea.vue -->
<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import InputControlFrame from "./internal/InputControlFrame.vue";
import { selectAndCopyReadonlyControl } from "./internal/readonly-copy";

defineOptions({ inheritAttrs: false });

type TextareaResize = "none" | "vertical";

interface Props {
  /** 调用方 class 作用于完整输入框外壳，而不是内部原生 textarea。 */
  class?: HTMLAttributes["class"];
  /** 调用方 style 作用于完整输入框外壳。 */
  style?: HTMLAttributes["style"];
  rows?: number;
  /** 默认不可拖拽；需要时可允许垂直调整。 */
  resize?: TextareaResize;
  disabled?: boolean;
  readonly?: boolean;
  /** 仅在 readonly 时，点击会全选并尝试复制当前展示值。 */
  copyOnClick?: boolean;
  required?: boolean;
  /** 只控制错误视觉与 aria-invalid；错误文案由 InputField 渲染。 */
  invalid?: boolean;
  /** 需要直接调整原生 textarea 时使用。 */
  textareaClass?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
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
