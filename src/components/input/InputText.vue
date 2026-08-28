<!-- src/components/input/InputText.vue -->
<script setup lang="ts">
import type { HTMLAttributes } from "vue";

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
  required: false,
  invalid: false,
  inputClass: undefined,
});

const model = defineModel<string>({ default: "" });
</script>

<template>
  <div
    :class="[
      'flex w-full items-center overflow-hidden rounded-xl border border-transparent bg-bg-muted text-fg transition-shadow',
      props.disabled || props.readonly ? 'cursor-not-allowed opacity-60' : '',
      props.invalid ? 'ring-2 ring-danger' : 'focus-within:ring-2 focus-within:ring-accent/30',
      props.class,
    ]"
    :style="props.style"
  >
    <slot name="prefix" />

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
        props.readonly ? 'select-all' : '',
        props.inputClass,
      ]"
    />

    <slot name="suffix" />
  </div>
</template>
