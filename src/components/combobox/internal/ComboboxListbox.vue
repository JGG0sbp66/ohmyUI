<script setup lang="ts">
import { computed } from "vue";

import Loading from "../../feedback/Loading.vue";
import type { SelectionDensity } from "../../internal/selection/selection.types";
import SelectionOptionRow from "../../internal/selection/SelectionOptionRow.vue";
import type {
  ComboboxFeedbackSlotProps,
  ComboboxOption,
  ComboboxOptionSlotProps,
  ComboboxValue,
} from "../combobox.types";

const props = withDefaults(
  defineProps<{
    id: string;
    options: readonly ComboboxOption[];
    modelValue: ComboboxValue | null;
    activeValue?: ComboboxValue;
    loading?: boolean;
    loadingLabel?: string;
    error?: string;
    emptyLabel?: string;
    disabled?: boolean;
    density?: SelectionDensity;
    feedbackRole?: "dialog" | "region";
    ariaLabel?: string;
    ariaLabelledby?: string;
  }>(),
  {
    activeValue: undefined,
    loading: false,
    loadingLabel: "正在加载",
    error: undefined,
    emptyLabel: "没有匹配结果",
    disabled: false,
    density: "compact",
    feedbackRole: "dialog",
    ariaLabel: undefined,
    ariaLabelledby: undefined,
  },
);

const emit = defineEmits<{
  activate: [option: ComboboxOption];
  select: [option: ComboboxOption];
}>();

defineSlots<{
  option?(props: ComboboxOptionSlotProps): unknown;
  loading?(props: ComboboxFeedbackSlotProps): unknown;
  empty?(props: ComboboxFeedbackSlotProps): unknown;
  error?(props: ComboboxFeedbackSlotProps): unknown;
}>();

const popupRole = computed<"dialog" | "listbox" | "region">(() =>
  !props.loading && !props.error && props.options.length > 0 ? "listbox" : props.feedbackRole,
);

function isSameValue(left: ComboboxValue | null | undefined, right: ComboboxValue): boolean {
  return left !== null && left !== undefined && Object.is(left, right);
}

function optionId(index: number): string {
  return `${props.id}-option-${index}`;
}

function optionKey(option: ComboboxOption, index: number): string {
  return `${typeof option.value}:${String(option.value)}:${index}`;
}

function handlePointerDown(event: PointerEvent): void {
  if (event.pointerType === "mouse") event.preventDefault();
}

function activate(option: ComboboxOption): void {
  if (props.disabled || option.disabled) return;
  emit("activate", option);
}

function select(option: ComboboxOption): void {
  if (props.disabled || option.disabled) return;
  emit("select", option);
}
</script>

<template>
  <div
    :id="props.id"
    :role="popupRole"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :aria-busy="props.loading || undefined"
    :aria-disabled="props.disabled || undefined"
    class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pb-1 outline-none"
  >
    <div
      v-if="props.loading"
      role="status"
      aria-live="polite"
      class="flex min-h-24 items-center justify-center px-4 py-6 text-center text-sm text-fg-muted"
    >
      <slot name="loading" :label="props.loadingLabel">
        <span class="flex items-center gap-2">
          <Loading class="text-base" />
          {{ props.loadingLabel }}
        </span>
      </slot>
    </div>

    <div
      v-else-if="props.error"
      role="alert"
      class="flex min-h-24 items-center justify-center px-4 py-6 text-center text-sm text-danger"
    >
      <slot name="error" :label="props.error">{{ props.error }}</slot>
    </div>

    <template v-else-if="props.options.length > 0">
      <SelectionOptionRow
        v-for="(option, index) in props.options"
        :id="optionId(index)"
        :key="optionKey(option, index)"
        role="option"
        :aria-selected="isSameValue(props.modelValue, option.value)"
        :aria-disabled="props.disabled || option.disabled || undefined"
        :data-active="isSameValue(props.activeValue, option.value) || undefined"
        :active="isSameValue(props.activeValue, option.value)"
        :selected="isSameValue(props.modelValue, option.value)"
        :disabled="props.disabled || option.disabled"
        :density="props.density"
        @pointerdown="handlePointerDown"
        @pointermove="activate(option)"
        @click="select(option)"
      >
        <slot
          name="option"
          :option="option"
          :active="isSameValue(props.activeValue, option.value)"
          :selected="isSameValue(props.modelValue, option.value)"
        >
          <component
            :is="option.icon"
            v-if="option.icon"
            aria-hidden="true"
            :class="['size-4 shrink-0', option.iconClass]"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate">{{ option.label }}</span>
            <span v-if="option.description" class="mt-0.5 block truncate text-xs text-fg-muted">
              {{ option.description }}
            </span>
          </span>
        </slot>
      </SelectionOptionRow>
    </template>

    <div
      v-else
      role="status"
      aria-live="polite"
      class="flex min-h-24 items-center justify-center px-4 py-6 text-center text-sm text-fg-muted"
    >
      <slot name="empty" :label="props.emptyLabel">{{ props.emptyLabel }}</slot>
    </div>
  </div>
</template>
