<!-- src/components/input/InputPassword.vue -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { HTMLAttributes } from "vue";

import InputText from "./InputText.vue";

defineOptions({ inheritAttrs: false });

interface Props {
  disabled?: boolean;
  readonly?: boolean;
  /** 仅在 readonly 时，点击会复制当前密码；默认关闭以避免意外暴露明文。 */
  copyOnClick?: boolean;
  required?: boolean;
  invalid?: boolean;
  /** 需要直接调整原生 input 时使用。 */
  inputClass?: HTMLAttributes["class"];
  /** 密文状态下显隐按钮的无障碍名称。 */
  showPasswordLabel?: string;
  /** 明文状态下显隐按钮的无障碍名称。 */
  hidePasswordLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  copyOnClick: false,
  required: false,
  invalid: false,
  inputClass: undefined,
  showPasswordLabel: "显示密码",
  hidePasswordLabel: "隐藏密码",
});

const emit = defineEmits<{
  "copy-success": [value: string];
  "copy-error": [error: unknown];
}>();

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
        class="mr-3 shrink-0 p-1 text-fg-soft transition-colors duration-150 enabled:cursor-pointer enabled:hover:text-fg-subtle disabled:cursor-not-allowed motion-reduce:transition-none"
        @mousedown.prevent
        @click="togglePasswordVisible"
      >
        <slot v-if="passwordVisible" name="hide-icon">
          <svg
            aria-hidden="true"
            class="size-4"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path
              d="M17.8827 19.2968C16.1814 20.3755 14.1638 21.0002 12.0003 21.0002C6.60812 21.0002 2.12215 17.1204 1.18164 12.0002C1.61832 9.62282 2.81932 7.5129 4.52047 5.93457L1.39366 2.80777L2.80788 1.39355L22.6069 21.1925L21.1927 22.6068L17.8827 19.2968ZM5.9356 7.3497C4.60673 8.56015 3.6378 10.1672 3.22278 12.0002C4.14022 16.0521 7.7646 19.0002 12.0003 19.0002C13.5997 19.0002 15.112 18.5798 16.4243 17.8384L14.396 15.8101C13.7023 16.2472 12.8808 16.5002 12.0003 16.5002C9.51498 16.5002 7.50026 14.4854 7.50026 12.0002C7.50026 11.1196 7.75317 10.2981 8.19031 9.60442L5.9356 7.3497ZM12.9139 14.328L9.67246 11.0866C9.5613 11.3696 9.50026 11.6777 9.50026 12.0002C9.50026 13.3809 10.6196 14.5002 12.0003 14.5002C12.3227 14.5002 12.6309 14.4391 12.9139 14.328ZM20.8068 16.5925L19.376 15.1617C20.0319 14.2268 20.5154 13.1586 20.7777 12.0002C19.8603 7.94818 16.2359 5.00016 12.0003 5.00016C11.1544 5.00016 10.3329 5.11773 9.55249 5.33818L7.97446 3.76015C9.22127 3.26959 10.5793 3.00016 12.0003 3.00016C17.3924 3.00016 21.8784 6.87992 22.8189 12.0002C22.5067 13.6998 21.8038 15.2628 20.8068 16.5925ZM11.7229 7.50857C11.8146 7.50299 11.9071 7.50016 12.0003 7.50016C14.4855 7.50016 16.5003 9.51488 16.5003 12.0002C16.5003 12.0933 16.4974 12.1858 16.4919 12.2775L11.7229 7.50857Z"
            />
          </svg>
        </slot>

        <slot v-else name="show-icon">
          <svg
            aria-hidden="true"
            class="size-4"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path
              d="M12.0003 3C17.3924 3 21.8784 6.87976 22.8189 12C21.8784 17.1202 17.3924 21 12.0003 21C6.60812 21 2.12215 17.1202 1.18164 12C2.12215 6.87976 6.60812 3 12.0003 3ZM12.0003 19C16.2359 19 19.8603 16.052 20.7777 12C19.8603 7.94803 16.2359 5 12.0003 5C7.7646 5 4.14022 7.94803 3.22278 12C4.14022 16.052 7.7646 19 12.0003 19ZM12.0003 16.5C9.51498 16.5 7.50026 14.4853 7.50026 12C7.50026 9.51472 9.51498 7.5 12.0003 7.5C14.4855 7.5 16.5003 9.51472 16.5003 12C16.5003 14.4853 14.4855 16.5 12.0003 16.5ZM12.0003 14.5C13.381 14.5 14.5003 13.3807 14.5003 12C14.5003 10.6193 13.381 9.5 12.0003 9.5C10.6196 9.5 9.50026 10.6193 9.50026 12C9.50026 13.3807 10.6196 14.5 12.0003 14.5Z"
            />
          </svg>
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
