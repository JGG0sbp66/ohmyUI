<!-- src/components/input/InputPassword.vue -->
<script setup lang="ts">
import { Eye, EyeOff } from "@lucide/vue";
import { computed, ref, watch } from "vue";

import type { InputPasswordProps, ReadonlyCopyEmits } from "./input.types";
import InputText from "./InputText.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<InputPasswordProps>(), {
  disabled: false,
  readonly: false,
  copyOnClick: false,
  required: false,
  invalid: false,
  inputClass: undefined,
  showPasswordLabel: "显示密码",
  hidePasswordLabel: "隐藏密码",
});

const emit = defineEmits<ReadonlyCopyEmits>();

const model = defineModel<string>({ default: "" });
const passwordVisible = ref(false);

const effectiveType = computed(() => (passwordVisible.value ? "text" : "password"));
const toggleLabel = computed(() =>
  passwordVisible.value ? props.hidePasswordLabel : props.showPasswordLabel,
);

watch(
  () => [props.disabled, props.readonly],
  ([disabled, readonly]) => {
    if (disabled || readonly) passwordVisible.value = false;
  },
);

const togglePasswordVisible = () => {
  if (props.disabled || props.readonly) return;
  passwordVisible.value = !passwordVisible.value;
};

const handleCopySuccess = (value: string) => {
  emit("copy-success", value);
};

const handleCopyError = (error: unknown) => {
  emit("copy-error", error);
};

defineSlots<{
  prefix?(): unknown;
  suffix?(): unknown;
  "show-icon"?(): unknown;
  "hide-icon"?(): unknown;
}>();
</script>

<template>
  <InputText
    v-bind="$attrs"
    v-model="model"
    :type="effectiveType"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :copy-on-click="props.copyOnClick"
    :required="props.required"
    :invalid="props.invalid"
    :input-class="['input-password__control pr-2', props.inputClass]"
    @copy-success="handleCopySuccess"
    @copy-error="handleCopyError"
  >
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix" />
    </template>

    <template #suffix>
      <slot name="suffix" />

      <button
        v-if="!props.readonly"
        type="button"
        :disabled="props.disabled"
        :title="toggleLabel"
        :aria-label="toggleLabel"
        :aria-pressed="passwordVisible"
        class="mr-3 shrink-0 p-1 text-fg-soft transition-colors enabled:cursor-pointer enabled:hover:text-fg-subtle disabled:cursor-not-allowed motion-reduce:transition-none"
        @mousedown.prevent
        @click="togglePasswordVisible"
      >
        <slot v-if="passwordVisible" name="hide-icon">
          <EyeOff aria-hidden="true" class="size-4" />
        </slot>

        <slot v-else name="show-icon">
          <Eye aria-hidden="true" class="size-4" />
        </slot>
      </button>
    </template>
  </InputText>
</template>

<style scoped>
/* 仅压掉本组件内的浏览器密码装饰，避免与自定义显隐按钮重叠。 */
:deep(.input-password__control)::-ms-reveal,
:deep(.input-password__control)::-ms-clear {
  display: none;
}

/* 未知伪元素会使整组选择器失效，因此 WebKit 规则单独声明。 */
:deep(.input-password__control)::-webkit-credentials-auto-fill-button {
  display: none;
}
</style>
