<!-- src/components/input/InputSearch.vue -->
<script setup lang="ts">
import { Search } from "@lucide/vue";

import ControlClearButton from "../internal/control/ControlClearButton.vue";
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
        class="ml-3 size-4 shrink-0 text-fg-soft transition-colors group-focus-within/search:text-fg-subtle"
      >
        <slot name="search-icon"><Search aria-hidden="true" class="size-4" /></slot>
      </span>
    </template>

    <template #suffix>
      <slot name="suffix" />

      <ControlClearButton
        v-if="model && !props.readonly"
        :label="props.clearLabel"
        :disabled="props.disabled"
        class="mr-2"
        @clear="clearSearch"
      >
        <template v-if="$slots['clear-icon']" #default><slot name="clear-icon" /></template>
      </ControlClearButton>
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
