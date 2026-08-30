<script setup lang="ts">
import { ChevronDown } from "@lucide/vue";
import {
  computed,
  mergeProps,
  nextTick,
  ref,
  useAttrs,
  useId,
  watch,
  type HTMLAttributes,
} from "vue";

import ButtonSecondary from "../../button/ButtonSecondary.vue";
import { useAdaptivePresentation } from "../../internal/selection/use-adaptive-presentation";
import BottomSheet from "../../overlay/bottom-sheet/BottomSheet.vue";
import Popover from "../../overlay/popover/Popover.vue";
import type {
  SelectFocusIntent,
  SelectListboxExpose,
  SelectOption,
  SelectRootProps,
  SelectValue,
} from "../select.types";
import SelectListbox from "./SelectListbox.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SelectRootProps>(), {
  placeholder: undefined,
  clearable: false,
  clearLabel: "清除选择",
  emptyLabel: "暂无可选项",
  disabled: false,
  required: false,
  invalid: false,
  block: false,
  presentation: "auto",
  placement: "bottom-start",
  offset: 8,
  collisionPadding: 8,
  sheetTitle: undefined,
  sheetDescription: undefined,
  closeLabel: "关闭选择器",
  teleportTo: "body",
  class: undefined,
  style: undefined,
  panelClass: undefined,
});

const emit = defineEmits<{
  change: [value: SelectValue | null];
  "open-change": [open: boolean];
}>();

const model = defineModel<SelectValue | null>({ default: null });
const open = defineModel<boolean>("open", { default: false });
const attrs = useAttrs();
const generatedId = useId();
const popoverRef = ref<{
  close: () => void;
  focusAdjacentToTrigger: (backwards?: boolean) => boolean;
  focusTrigger: () => boolean;
} | null>(null);
const listboxRef = ref<SelectListboxExpose | null>(null);
let focusIntent: SelectFocusIntent = "selected";

const { isSheet } = useAdaptivePresentation(() => props.presentation);
const triggerId = computed(() =>
  typeof attrs.id === "string" && attrs.id ? attrs.id : `select-${generatedId}`,
);
const listboxId = computed(() => `${triggerId.value}-listbox`);
const valueDescriptionId = computed(() => `${triggerId.value}-value`);
const options = computed(() => props.groups.flatMap((group) => group.options));
const selectedOption = computed<SelectOption | null>(
  () => options.value.find((option) => Object.is(option.value, model.value)) ?? null,
);
const displayLabel = computed(
  () => selectedOption.value?.label ?? props.placeholder ?? props.label,
);
const valueDescription = computed(() =>
  selectedOption.value ? `当前值：${selectedOption.value.label}` : "当前未选择",
);
const hasSelection = computed(() => selectedOption.value !== null);

function readAriaAttribute(name: string): string | undefined {
  const value = attrs[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function joinIdReferences(...values: (string | undefined)[]): string | undefined {
  const joined = values.filter(Boolean).join(" ");
  return joined || undefined;
}

const fieldAriaLabelledby = computed(() => readAriaAttribute("aria-labelledby"));
const fieldAriaLabel = computed(() => readAriaAttribute("aria-label") ?? props.label);
const fieldAriaDescribedby = computed(() => {
  // useAttrs 始终包含最新值但本身不参与依赖追踪；字段校验变化时随 invalid 刷新 IDREF。
  void props.invalid;
  return joinIdReferences(readAriaAttribute("aria-describedby"), valueDescriptionId.value);
});
const fieldAriaErrormessage = computed(() => {
  void props.invalid;
  return readAriaAttribute("aria-errormessage");
});
const fieldInvalid = computed(
  () => props.invalid || attrs["aria-invalid"] === true || attrs["aria-invalid"] === "true",
);
const triggerClass = computed<HTMLAttributes["class"]>(() => [
  "h-10 min-w-0 px-3 text-sm",
  "[&>span:not(:last-child)]:min-w-0 [&>span:not(:last-child)]:truncate",
  props.block ? "w-full" : "max-w-44",
  props.invalid ? "ring-2 ring-danger" : "",
  props.class,
]);

function handleTriggerKeydown(event: KeyboardEvent): void {
  if (props.disabled || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
  event.preventDefault();
  focusIntent = event.key === "ArrowUp" ? "last" : "first";
  open.value = true;
  listboxRef.value?.focusInitial(focusIntent);
}

const baseTriggerAttrs = computed(() =>
  mergeProps(attrs, {
    id: triggerId.value,
    class: triggerClass.value,
    style: props.style,
    "aria-label": fieldAriaLabelledby.value ? undefined : fieldAriaLabel.value,
    "aria-labelledby": fieldAriaLabelledby.value,
    "aria-describedby": fieldAriaDescribedby.value,
    "aria-errormessage": fieldAriaErrormessage.value,
    "aria-haspopup": "listbox",
    "aria-expanded": open.value,
    "aria-controls": listboxId.value,
    "aria-invalid": fieldInvalid.value ? "true" : undefined,
    onKeydown: handleTriggerKeydown,
  }),
);

const sheetTriggerAttrs = computed(() =>
  mergeProps(baseTriggerAttrs.value, {
    onClick: () => {
      if (props.disabled) return;
      focusIntent = "selected";
      open.value = true;
    },
  }),
);

function decoratePopoverTrigger(popoverAttrs: Record<string, unknown>): Record<string, unknown> {
  const { onClick, ...rest } = popoverAttrs;
  return mergeProps(baseTriggerAttrs.value, rest, {
    id: triggerId.value,
    "aria-haspopup": "listbox",
    "aria-expanded": open.value,
    "aria-controls": listboxId.value,
    onClick: () => {
      focusIntent = "selected";
      (onClick as (() => void) | undefined)?.();
    },
  });
}

function handleReady(): void {
  listboxRef.value?.focusInitial(focusIntent);
}

function handleSelect(value: SelectValue | null): void {
  model.value = value;
  emit("change", value);
  if (isSheet.value) open.value = false;
  else popoverRef.value?.close();
}

function handleTab(event: KeyboardEvent): void {
  if (isSheet.value) return;
  const moved = popoverRef.value?.focusAdjacentToTrigger(event.shiftKey) ?? false;
  if (moved) event.preventDefault();
  else popoverRef.value?.focusTrigger();
  open.value = false;
}

watch(open, (value) => emit("open-change", value));
watch(isSheet, async () => {
  const activeDocument = typeof document === "undefined" ? null : document;
  const activeElement = activeDocument?.activeElement;
  const listboxElement = activeDocument?.getElementById(listboxId.value);
  const activePanel = listboxElement?.closest(
    "[data-ohmyui-popover-panel], [data-ohmyui-bottom-sheet-panel]",
  );
  const focusedSelect =
    activeElement === activeDocument?.getElementById(triggerId.value) ||
    activeElement === listboxElement ||
    Boolean(activeElement && activePanel?.contains(activeElement));

  if (open.value) open.value = false;
  if (!activeDocument || !focusedSelect) return;

  await nextTick();
  activeDocument.getElementById(triggerId.value)?.focus({ preventScroll: true });
});
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) open.value = false;
  },
);
</script>

<template>
  <span :id="valueDescriptionId" class="sr-only">{{ valueDescription }}</span>

  <Popover
    v-if="!isSheet"
    ref="popoverRef"
    v-model="open"
    :placement="props.placement"
    :offset="props.offset"
    :collision-padding="props.collisionPadding"
    :disabled="props.disabled"
    :teleport-to="props.teleportTo"
    :auto-focus="false"
    role="presentation"
    :panel-class="['flex w-64 flex-col rounded-xl! p-2', props.panelClass]"
    @ready="handleReady"
  >
    <template #trigger="{ attrs: popoverAttrs, open: popoverOpen }">
      <ButtonSecondary
        v-bind="decoratePopoverTrigger(popoverAttrs)"
        :text="displayLabel"
        :disabled="props.disabled"
        :block="props.block"
        align="start"
        :is-active="popoverOpen || hasSelection"
      >
        <component
          :is="selectedOption.icon"
          v-if="selectedOption?.icon"
          aria-hidden="true"
          :class="['size-4 shrink-0', selectedOption.iconClass]"
        />
        <svg
          v-else
          class="size-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
        <template #suffix>
          <ChevronDown
            aria-hidden="true"
            class="size-3.5 transition-transform"
            :class="open ? 'rotate-180' : ''"
          />
        </template>
      </ButtonSecondary>
    </template>

    <SelectListbox
      :id="listboxId"
      ref="listboxRef"
      :model-value="model"
      :groups="props.groups"
      :clearable="props.clearable"
      :clear-label="props.clearLabel"
      :empty-label="props.emptyLabel"
      :disabled="props.disabled"
      :aria-label="fieldAriaLabelledby ? undefined : fieldAriaLabel"
      :aria-labelledby="fieldAriaLabelledby"
      :aria-required="props.required"
      :aria-invalid="fieldInvalid"
      :aria-describedby="fieldAriaDescribedby"
      :aria-errormessage="fieldAriaErrormessage"
      close-on-tab
      @select="handleSelect"
      @tab="handleTab"
    />
  </Popover>

  <template v-else>
    <ButtonSecondary
      v-bind="sheetTriggerAttrs"
      :text="displayLabel"
      :disabled="props.disabled"
      :block="props.block"
      align="start"
      :is-active="open || hasSelection"
    >
      <component
        :is="selectedOption.icon"
        v-if="selectedOption?.icon"
        aria-hidden="true"
        :class="['size-4 shrink-0', selectedOption.iconClass]"
      />
      <svg
        v-else
        class="size-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4 6h16" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
      </svg>
      <template #suffix>
        <ChevronDown
          aria-hidden="true"
          class="size-3.5 transition-transform"
          :class="open ? 'rotate-180' : ''"
        />
      </template>
    </ButtonSecondary>

    <BottomSheet
      v-model="open"
      :title="props.sheetTitle ?? props.label"
      :description="props.sheetDescription"
      :close-label="props.closeLabel"
      :teleport-to="props.teleportTo"
      initial-focus="[data-select-listbox]"
    >
      <SelectListbox
        :id="listboxId"
        ref="listboxRef"
        :model-value="model"
        :groups="props.groups"
        :clearable="props.clearable"
        :clear-label="props.clearLabel"
        :empty-label="props.emptyLabel"
        :disabled="props.disabled"
        :aria-label="fieldAriaLabelledby ? undefined : fieldAriaLabel"
        :aria-labelledby="fieldAriaLabelledby"
        :aria-required="props.required"
        :aria-invalid="fieldInvalid"
        :aria-describedby="fieldAriaDescribedby"
        :aria-errormessage="fieldAriaErrormessage"
        density="touch"
        @select="handleSelect"
      />
    </BottomSheet>
  </template>
</template>
