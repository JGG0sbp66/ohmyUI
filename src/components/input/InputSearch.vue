<!-- src/components/input/InputSearch.vue -->
<script setup lang="ts">
import type { InputSearchEmits, InputSearchProps } from "./input.types";
import InputText from "./InputText.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<InputSearchProps>(), {
  class: undefined,
  style: undefined,
  width: "max-w-56",
  disabled: false,
  readonly: false,
  copyOnClick: false,
  required: false,
  invalid: false,
  inputClass: undefined,
  clearLabel: "清空搜索",
});

const emit = defineEmits<InputSearchEmits>();

const model = defineModel<string>({ default: "" });

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Enter" || event.isComposing || props.disabled) return;
  emit("search", model.value);
};

const clearSearch = () => {
  if (props.disabled || props.readonly) return;
  model.value = "";
  emit("search", "");
};

const handleCopySuccess = (value: string) => {
  emit("copy-success", value);
};

const handleCopyError = (error: unknown) => {
  emit("copy-error", error);
};

defineSlots<{
  "search-icon"?(): unknown;
  "clear-icon"?(): unknown;
  suffix?(): unknown;
}>();
</script>

<template>
  <InputText
    v-bind="$attrs"
    v-model="model"
    type="search"
    :class="['group/search', props.width, props.class]"
    :style="props.style"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :copy-on-click="props.copyOnClick"
    :required="props.required"
    :invalid="props.invalid"
    :input-class="['input-search__control min-w-0 px-2 font-normal', props.inputClass]"
    @keydown="handleKeydown"
    @copy-success="handleCopySuccess"
    @copy-error="handleCopyError"
  >
    <template #prefix>
      <span
        aria-hidden="true"
        class="ml-3 size-4 shrink-0 text-fg-soft transition-colors duration-150 group-focus-within/search:text-fg-subtle motion-reduce:transition-none"
      >
        <slot name="search-icon">
          <svg
            class="size-4"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path
              d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"
            />
          </svg>
        </slot>
      </span>
    </template>

    <template #suffix>
      <slot name="suffix" />

      <button
        v-if="model && !props.readonly"
        type="button"
        :disabled="props.disabled"
        :title="props.clearLabel"
        :aria-label="props.clearLabel"
        class="mr-2 shrink-0 p-1 text-fg-soft transition-colors duration-150 enabled:cursor-pointer enabled:hover:text-fg-subtle disabled:cursor-not-allowed motion-reduce:transition-none"
        @mousedown.prevent
        @click="clearSearch"
      >
        <slot name="clear-icon">
          <svg
            aria-hidden="true"
            class="size-4"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path
              d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"
            />
          </svg>
        </slot>
      </button>
    </template>
  </InputText>
</template>

<style scoped>
/* 仅隐藏本组件内的原生搜索装饰，避免与自定义清空按钮重叠。 */
:deep(.input-search__control)::-webkit-search-cancel-button,
:deep(.input-search__control)::-webkit-search-decoration,
:deep(.input-search__control)::-webkit-search-results-button,
:deep(.input-search__control)::-webkit-search-results-decoration {
  appearance: none;
}

:deep(.input-search__control)::-ms-clear {
  display: none;
}
</style>
