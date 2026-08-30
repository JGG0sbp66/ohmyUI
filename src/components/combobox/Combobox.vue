<script setup lang="ts">
import { ChevronDown, Search } from "@lucide/vue";
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

import ButtonSecondary from "../button/ButtonSecondary.vue";
import { useAdaptivePresentation } from "../internal/selection/use-adaptive-presentation";
import BottomSheet from "../overlay/bottom-sheet/BottomSheet.vue";
import Popover from "../overlay/popover/Popover.vue";
import type {
  ComboboxFeedbackSlotProps,
  ComboboxOption,
  ComboboxOptionSlotProps,
  ComboboxProps,
  ComboboxValue,
} from "./combobox.types";
import ComboboxControl from "./internal/ComboboxControl.vue";
import ComboboxListbox from "./internal/ComboboxListbox.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ComboboxProps>(), {
  placeholder: undefined,
  disabled: false,
  required: false,
  invalid: false,
  block: false,
  clearable: false,
  clearLabel: "清除输入",
  loading: false,
  loadingLabel: "正在加载",
  error: undefined,
  emptyLabel: "没有匹配结果",
  presentation: "auto",
  placement: "bottom-start",
  offset: 8,
  collisionPadding: 8,
  panelClass: undefined,
  sheetTitle: undefined,
  sheetDescription: undefined,
  closeLabel: "关闭组合框",
  teleportTo: "body",
  class: undefined,
  style: undefined,
  inputClass: undefined,
});

const emit = defineEmits<{
  change: [value: ComboboxValue | null];
  "query-change": [query: string];
  "open-change": [open: boolean];
}>();

const modelBinding = defineModel<ComboboxValue | null>({ default: null });
const queryBinding = defineModel<string>("query", { default: "" });
const openBinding = defineModel<boolean>("open", { default: false });
const model = ref<ComboboxValue | null>(modelBinding.value);
const query = ref(queryBinding.value);
const open = ref(openBinding.value);
const attrs = useAttrs();
const generatedId = useId();
const popoverRef = ref<{ close: () => void } | null>(null);
const activeValue = ref<ComboboxValue>();
const composing = ref(false);
const selectionLabel = ref("");
let baselineValue: ComboboxValue | null = model.value;
let baselineQuery = query.value;
let baselineSelectionLabel = "";
let pendingActiveReset = false;
let suppressNextFocusOpen = false;
let warnedAboutDuplicateValues = false;
let modelReconciliationGeneration = 0;
let queryReconciliationGeneration = 0;
let openReconciliationGeneration = 0;

const { isSheet } = useAdaptivePresentation(() => props.presentation);
const controlId = computed(() =>
  typeof attrs.id === "string" && attrs.id ? attrs.id : `combobox-${generatedId}`,
);
const sheetInputId = computed(() => `${controlId.value}-input`);
const sheetPanelId = computed(() => `${controlId.value}-sheet`);
const listboxId = computed(() => `${controlId.value}-listbox`);
const options = computed(() => props.options);
const selectedOption = computed(
  () => options.value.find((option) => Object.is(option.value, model.value)) ?? null,
);
const feedbackVisible = computed(() => props.loading || Boolean(props.error));
const hasListboxPopup = computed(() => !feedbackVisible.value && options.value.length > 0);
const popupRole = computed<"dialog" | "listbox">(() =>
  hasListboxPopup.value ? "listbox" : "dialog",
);
const enabledOptions = computed(() =>
  feedbackVisible.value || props.disabled ? [] : options.value.filter((option) => !option.disabled),
);
const activeOption = computed(
  () => enabledOptions.value.find((option) => Object.is(option.value, activeValue.value)) ?? null,
);
const activeOptionId = computed(() => {
  if (!open.value || !activeOption.value) return undefined;
  const index = options.value.findIndex((option) =>
    Object.is(option.value, activeOption.value?.value),
  );
  return index < 0 ? undefined : `${listboxId.value}-option-${index}`;
});
const hasValue = computed(() => query.value.length > 0 || model.value !== null);
const displayLabel = computed(
  () =>
    (model.value !== null ? selectionLabel.value : query.value) || props.placeholder || props.label,
);

function readAriaAttribute(name: string): string | undefined {
  const value = attrs[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const fieldAriaLabelledby = computed(() => readAriaAttribute("aria-labelledby"));
const fieldAriaLabel = computed(() => readAriaAttribute("aria-label") ?? props.label);
const fieldAriaDescribedby = computed(() => {
  void props.invalid;
  return readAriaAttribute("aria-describedby");
});
const fieldAriaErrormessage = computed(() => {
  void props.invalid;
  return readAriaAttribute("aria-errormessage");
});
const fieldInvalid = computed(
  () => props.invalid || attrs["aria-invalid"] === true || attrs["aria-invalid"] === "true",
);
const launcherClass = computed<HTMLAttributes["class"]>(() => [
  "h-10 min-w-0 px-3 text-sm",
  "[&>span:not(:last-child)]:min-w-0 [&>span:not(:last-child)]:truncate",
  props.block ? "w-full" : "max-w-64",
  fieldInvalid.value ? "ring-2 ring-danger" : "",
  props.class,
]);

function scheduleModelReconciliation(): void {
  const generation = ++modelReconciliationGeneration;
  void nextTick(() => {
    if (generation !== modelReconciliationGeneration) return;
    if (!Object.is(modelBinding.value, model.value)) {
      synchronizeExternalModel(modelBinding.value, true);
    }
  });
}

function scheduleQueryReconciliation(): void {
  const generation = ++queryReconciliationGeneration;
  void nextTick(() => {
    if (generation !== queryReconciliationGeneration) return;
    if (queryBinding.value !== query.value) synchronizeExternalQuery(queryBinding.value, true);
  });
}

function assignQuery(value: string, notify = false): boolean {
  const changed = query.value !== value;
  if (changed) query.value = value;
  if (queryBinding.value !== value) queryBinding.value = value;
  if (changed && notify) emit("query-change", value);
  scheduleQueryReconciliation();
  return changed;
}

function assignModel(value: ComboboxValue | null): boolean {
  const changed = !Object.is(model.value, value);
  if (changed) model.value = value;
  if (!Object.is(modelBinding.value, value)) modelBinding.value = value;
  scheduleModelReconciliation();
  return changed;
}

function assignOpen(value: boolean): boolean {
  if (open.value === value) return false;
  open.value = value;
  return true;
}

function captureBaseline(): void {
  baselineValue = model.value;
  baselineQuery = query.value;
  baselineSelectionLabel = selectionLabel.value;
}

function restoreBaseline(): void {
  const changed = assignModel(baselineValue);
  selectionLabel.value = baselineSelectionLabel;
  assignQuery(baselineQuery, true);
  pendingActiveReset = false;
  setActive(undefined);
  if (changed) emit("change", baselineValue);
}

function setActive(option: ComboboxOption | undefined, scroll = false): void {
  activeValue.value = option?.value;
  if (!option || !scroll) return;

  void nextTick(() => {
    const id = activeOptionId.value;
    if (!id || typeof document === "undefined") return;
    document.getElementById(id)?.scrollIntoView({ block: "nearest" });
  });
}

function selectedEnabledOption(): ComboboxOption | undefined {
  return enabledOptions.value.find((option) => Object.is(option.value, model.value));
}

function syncActive(intent: "current" | "selected" | "first" | "last" = "selected"): void {
  const enabled = enabledOptions.value;
  if (enabled.length === 0) {
    setActive(undefined);
    return;
  }

  const current = enabled.find((option) => Object.is(option.value, activeValue.value));
  if (intent === "current" && current) return;
  const target =
    intent === "first"
      ? enabled[0]
      : intent === "last"
        ? enabled.at(-1)
        : (selectedEnabledOption() ?? enabled[0]);
  setActive(target, true);
}

function moveActive(direction: 1 | -1): void {
  const enabled = enabledOptions.value;
  if (enabled.length === 0) return;
  const current = enabled.findIndex((option) => Object.is(option.value, activeValue.value));
  const next = current < 0 ? (direction > 0 ? 0 : enabled.length - 1) : current + direction;
  setActive(enabled[(next + enabled.length) % enabled.length], true);
}

function previewPendingActiveReset(): void {
  if (!pendingActiveReset || !open.value || feedbackVisible.value) return;
  syncActive("first");
}

function consumePendingActiveReset(): void {
  if (!pendingActiveReset || !open.value || feedbackVisible.value) return;
  pendingActiveReset = false;
  syncActive("first");
}

function queueActiveReset(): void {
  pendingActiveReset = true;
  setActive(undefined);
  void nextTick(previewPendingActiveReset);
}

function focusCurrentInput(suppressOpen = false): void {
  if (typeof document === "undefined") return;
  const id = isSheet.value ? sheetInputId.value : controlId.value;
  const input = document.getElementById(id);
  if (!input) return;

  if (suppressOpen && !isSheet.value) suppressNextFocusOpen = true;
  input.focus({ preventScroll: true });
  suppressNextFocusOpen = false;
}

function requestOpen(intent: "selected" | "first" | "last" = "selected"): void {
  if (props.disabled) return;
  if (!open.value) assignOpen(true);
  if (pendingActiveReset) void nextTick(previewPendingActiveReset);
  else syncActive(intent);
}

function applyInputValue(value: string): void {
  assignQuery(value, true);
  if (model.value !== null && value !== selectionLabel.value) {
    if (assignModel(null)) emit("change", null);
  }
  queueActiveReset();
  requestOpen("first");
}

function handleInput(event: Event): void {
  const inputEvent = event as InputEvent;
  if (composing.value || inputEvent.isComposing) return;
  applyInputValue((event.currentTarget as HTMLInputElement).value);
}

function handleCompositionEnd(event: CompositionEvent): void {
  composing.value = false;
  applyInputValue((event.currentTarget as HTMLInputElement).value);
}

function handleInputFocus(): void {
  if (suppressNextFocusOpen) return;
  requestOpen("selected");
}

function handleKeydown(event: KeyboardEvent): void {
  if (props.disabled || composing.value || event.isComposing) return;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      if (!open.value) requestOpen("first");
      else moveActive(1);
      return;
    case "ArrowUp":
      event.preventDefault();
      if (!open.value) requestOpen("last");
      else moveActive(-1);
      return;
    case "Home":
      if (!open.value) return;
      event.preventDefault();
      setActive(enabledOptions.value[0], true);
      return;
    case "End":
      if (!open.value) return;
      event.preventDefault();
      setActive(enabledOptions.value.at(-1), true);
      return;
    case "Enter":
      if (!open.value || !activeOption.value) return;
      event.preventDefault();
      commitOption(activeOption.value);
      return;
    case "Escape":
      if (!open.value) return;
      event.preventDefault();
      event.stopPropagation();
      restoreBaseline();
      assignOpen(false);
      return;
    case "Tab":
      if (open.value && !isSheet.value) assignOpen(false);
      return;
  }
}

function handleBlur(event: FocusEvent): void {
  if (isSheet.value || !open.value) return;
  const input = event.currentTarget as HTMLInputElement;

  void nextTick(() => {
    const activeElement = input.ownerDocument.activeElement;
    const control = input.closest("[data-ohmyui-combobox-control]");
    const popup = input.ownerDocument.getElementById(listboxId.value);
    const panel = popup?.closest("[data-ohmyui-popover-panel]");
    if (activeElement && (control?.contains(activeElement) || panel?.contains(activeElement)))
      return;
    assignOpen(false);
  });
}

function handleClear(): void {
  if (props.disabled) return;
  const changed = assignModel(null);
  selectionLabel.value = "";
  assignQuery("", true);
  if (changed) emit("change", null);
  captureBaseline();
  queueActiveReset();
  requestOpen("first");
  void nextTick(() => focusCurrentInput());
}

function commitOption(option: ComboboxOption): void {
  if (props.disabled || option.disabled) return;
  selectionLabel.value = option.label;
  const changed = assignModel(option.value);
  assignQuery(option.label, true);
  if (changed) emit("change", option.value);
  pendingActiveReset = false;
  setActive(option);
  captureBaseline();

  if (isSheet.value) assignOpen(false);
  else {
    popoverRef.value?.close();
    void nextTick(() => focusCurrentInput(true));
  }
}

function handlePopoverDismiss(reason: "trigger" | "outside" | "escape" | "close"): void {
  if (reason === "escape") restoreBaseline();
}

function handleSheetDismiss(reason: "backdrop" | "escape" | "close" | "drag"): void {
  if (reason === "escape") restoreBaseline();
}

function validateOptionValues(): void {
  if (!import.meta.env.DEV) return;

  const duplicate = options.value.find((option, index, collection) =>
    collection.slice(0, index).some((candidate) => Object.is(candidate.value, option.value)),
  );
  if (!duplicate) {
    warnedAboutDuplicateValues = false;
    return;
  }
  if (warnedAboutDuplicateValues) return;

  warnedAboutDuplicateValues = true;
  // oxlint-disable-next-line no-console
  console.warn("Combobox 的 option.value 必须唯一。", duplicate.value);
}

const baseInputAttrs = computed(() =>
  mergeProps({ autocomplete: "off", spellcheck: false }, attrs, {
    role: "combobox",
    "aria-autocomplete": "list",
    "aria-haspopup": popupRole.value,
    "aria-expanded": open.value,
    "aria-controls": listboxId.value,
    "aria-activedescendant": activeOptionId.value,
    "aria-label": fieldAriaLabelledby.value ? undefined : fieldAriaLabel.value,
    "aria-labelledby": fieldAriaLabelledby.value,
    "aria-describedby": fieldAriaDescribedby.value,
    "aria-errormessage": fieldAriaErrormessage.value,
    "aria-required": props.required || undefined,
    "aria-invalid": fieldInvalid.value ? "true" : undefined,
    onFocus: handleInputFocus,
    onClick: () => requestOpen("selected"),
    onInput: handleInput,
    onKeydown: handleKeydown,
    onBlur: handleBlur,
    onCompositionstart: () => {
      composing.value = true;
    },
    onCompositionend: handleCompositionEnd,
  }),
);
const desktopInputAttrs = computed(() =>
  mergeProps(baseInputAttrs.value, {
    id: controlId.value,
    "data-ohmyui-combobox-input": "",
  }),
);
const sheetInputAttrs = computed(() => {
  const listboxExpanded = open.value && hasListboxPopup.value;
  return mergeProps(baseInputAttrs.value, {
    id: sheetInputId.value,
    "data-ohmyui-combobox-input": "",
    "aria-haspopup": "listbox",
    "aria-expanded": listboxExpanded,
    "aria-controls": listboxExpanded ? listboxId.value : undefined,
    "aria-activedescendant": listboxExpanded ? activeOptionId.value : undefined,
    "aria-label": fieldAriaLabel.value,
    "aria-labelledby": undefined,
  });
});
const sheetLauncherAttrs = computed(() => ({
  id: controlId.value,
  style: props.style,
  "aria-label": fieldAriaLabelledby.value ? undefined : fieldAriaLabel.value,
  "aria-labelledby": fieldAriaLabelledby.value,
  "aria-describedby": fieldAriaDescribedby.value,
  "aria-errormessage": fieldAriaErrormessage.value,
  "aria-haspopup": "dialog",
  "aria-expanded": open.value,
  "aria-controls": sheetPanelId.value,
  "aria-required": props.required || undefined,
  "aria-invalid": fieldInvalid.value ? "true" : undefined,
  onClick: () => requestOpen("selected"),
  onKeydown: (event: KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    requestOpen(event.key === "ArrowUp" ? "last" : "first");
  },
}));

function synchronizeExternalModel(value: ComboboxValue | null, updateBaseline: boolean): void {
  model.value = value;
  if (value === null) selectionLabel.value = "";
  else {
    const option = options.value.find((candidate) => Object.is(candidate.value, value));
    if (option) {
      const previousLabel = selectionLabel.value;
      selectionLabel.value = option.label;
      if (!query.value || query.value === previousLabel) assignQuery(option.label);
    } else {
      selectionLabel.value = query.value;
    }
  }
  if (updateBaseline && open.value) {
    pendingActiveReset = false;
    setActive(undefined);
    captureBaseline();
    void nextTick(() => {
      if (open.value) syncActive("selected");
    });
  }
}

function synchronizeExternalQuery(value: string, updateBaseline: boolean): void {
  query.value = value;
  queueActiveReset();
  if (updateBaseline && open.value) captureBaseline();
}

synchronizeExternalModel(modelBinding.value, false);
captureBaseline();

watch(
  modelBinding,
  (value) => {
    modelReconciliationGeneration += 1;
    if (Object.is(value, model.value)) return;
    synchronizeExternalModel(value, true);
  },
  { flush: "sync" },
);

watch(
  queryBinding,
  (value) => {
    queryReconciliationGeneration += 1;
    if (value === query.value) return;
    synchronizeExternalQuery(value, true);
  },
  { flush: "sync" },
);

watch(
  selectedOption,
  (option) => {
    if (!option || model.value === null) return;
    const previousLabel = selectionLabel.value;
    selectionLabel.value = option.label;
    if (!query.value || query.value === previousLabel) assignQuery(option.label);
    if (open.value && Object.is(baselineValue, model.value)) {
      if (baselineQuery === previousLabel) baselineQuery = option.label;
      if (baselineSelectionLabel === previousLabel) baselineSelectionLabel = option.label;
    }
  },
  { flush: "sync" },
);

watch(
  () => props.options,
  () => {
    validateOptionValues();
    if (!open.value) return;
    if (feedbackVisible.value || props.disabled) {
      setActive(undefined);
      return;
    }
    if (pendingActiveReset) consumePendingActiveReset();
    else syncActive("current");
  },
  { deep: true, immediate: true },
);

watch(
  () => [props.loading, props.error, props.disabled],
  () => {
    if (!open.value) return;
    if (feedbackVisible.value || props.disabled) {
      setActive(undefined);
      return;
    }
    if (pendingActiveReset) consumePendingActiveReset();
    else syncActive("current");
  },
);

watch(
  openBinding,
  (value) => {
    openReconciliationGeneration += 1;
    if (value !== open.value) open.value = value;
  },
  { flush: "sync" },
);

watch(
  open,
  (value) => {
    const reconciliationGeneration = ++openReconciliationGeneration;
    if (openBinding.value !== value) openBinding.value = value;
    void nextTick(() => {
      if (reconciliationGeneration !== openReconciliationGeneration) return;
      if (openBinding.value !== open.value) open.value = openBinding.value;
    });

    emit("open-change", value);
    if (value) {
      captureBaseline();
      if (pendingActiveReset) void nextTick(previewPendingActiveReset);
      else syncActive("selected");
    }
  },
  { flush: "sync" },
);

watch(isSheet, async () => {
  const activeDocument = typeof document === "undefined" ? null : document;
  const activeElement = activeDocument?.activeElement;
  const control = activeDocument?.getElementById(controlId.value);
  const controlFrame = control?.closest("[data-ohmyui-combobox-control]");
  const popup = activeDocument?.getElementById(listboxId.value);
  const activePanel = popup?.closest(
    "[data-ohmyui-popover-panel], [data-ohmyui-bottom-sheet-panel]",
  );
  const focusedCombobox = Boolean(
    activeElement &&
    (control?.contains(activeElement) ||
      controlFrame?.contains(activeElement) ||
      activePanel?.contains(activeElement)),
  );

  if (open.value) assignOpen(false);
  if (!activeDocument || !focusedCombobox) return;

  await nextTick();
  const nextControl = activeDocument.getElementById(controlId.value);
  if (!nextControl) return;
  if (!isSheet.value) suppressNextFocusOpen = true;
  nextControl.focus({ preventScroll: true });
  suppressNextFocusOpen = false;
});

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) assignOpen(false);
  },
);
</script>

<template>
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
    :return-focus="false"
    role="presentation"
    :panel-class="[
      'flex max-h-[var(--ohmyui-available-height)] w-72 max-w-[calc(100vw-1rem)] flex-col rounded-xl! p-2',
      props.panelClass,
    ]"
    @ready="focusCurrentInput"
    @dismiss="handlePopoverDismiss"
  >
    <template #trigger="{ attrs: popoverAttrs }">
      <ComboboxControl
        :ref="popoverAttrs.ref"
        :query="query"
        :input-attrs="desktopInputAttrs"
        :disabled="props.disabled"
        :invalid="fieldInvalid"
        :block="props.block"
        :clearable="props.clearable"
        :clear-label="props.clearLabel"
        :loading="props.loading"
        :loading-label="props.loadingLabel"
        :expanded="open"
        :has-value="hasValue"
        :root-class="props.class"
        :root-style="props.style"
        :input-class="props.inputClass"
        @clear="handleClear"
      >
        <template v-if="$slots.prefix" #prefix><slot name="prefix" /></template>
        <template v-if="$slots.suffix" #suffix><slot name="suffix" /></template>
        <template v-if="$slots['clear-icon']" #clear-icon><slot name="clear-icon" /></template>
      </ComboboxControl>
    </template>

    <ComboboxListbox
      :id="listboxId"
      :options="options"
      :model-value="model"
      :active-value="activeValue"
      :loading="props.loading"
      :loading-label="props.loadingLabel"
      :error="props.error"
      :empty-label="props.emptyLabel"
      :disabled="props.disabled"
      :aria-label="fieldAriaLabelledby ? undefined : fieldAriaLabel"
      :aria-labelledby="fieldAriaLabelledby"
      @activate="setActive"
      @select="commitOption"
    >
      <template v-if="$slots.option" #option="slotProps: ComboboxOptionSlotProps">
        <slot name="option" v-bind="slotProps" />
      </template>
      <template v-if="$slots.loading" #loading="slotProps: ComboboxFeedbackSlotProps">
        <slot name="loading" v-bind="slotProps" />
      </template>
      <template v-if="$slots.empty" #empty="slotProps: ComboboxFeedbackSlotProps">
        <slot name="empty" v-bind="slotProps" />
      </template>
      <template v-if="$slots.error" #error="slotProps: ComboboxFeedbackSlotProps">
        <slot name="error" v-bind="slotProps" />
      </template>
    </ComboboxListbox>
  </Popover>

  <template v-else>
    <ButtonSecondary
      v-bind="sheetLauncherAttrs"
      :text="displayLabel"
      :disabled="props.disabled"
      :block="props.block"
      align="start"
      :is-active="open || hasValue"
      :class="launcherClass"
    >
      <slot name="prefix"><Search aria-hidden="true" class="size-4 shrink-0" /></slot>
      <template #suffix>
        <ChevronDown
          aria-hidden="true"
          class="size-3.5 transition-transform motion-reduce:transition-none"
          :class="open ? 'rotate-180' : ''"
        />
      </template>
    </ButtonSecondary>

    <BottomSheet
      :id="sheetPanelId"
      v-model="open"
      :title="props.sheetTitle ?? props.label"
      :description="props.sheetDescription"
      :close-label="props.closeLabel"
      :teleport-to="props.teleportTo"
      initial-focus="[data-ohmyui-combobox-input]"
      :panel-class="['max-h-[min(85svh,42rem)]', props.panelClass]"
      @dismiss="handleSheetDismiss"
    >
      <div class="flex min-h-0 flex-col pb-4">
        <ComboboxControl
          :query="query"
          :input-attrs="sheetInputAttrs"
          :disabled="props.disabled"
          :invalid="fieldInvalid"
          block
          :clearable="props.clearable"
          :clear-label="props.clearLabel"
          :loading="props.loading"
          :loading-label="props.loadingLabel"
          expanded
          :has-value="hasValue"
          root-class="mb-3 shrink-0"
          :input-class="props.inputClass"
          @clear="handleClear"
        >
          <template v-if="$slots.prefix" #prefix><slot name="prefix" /></template>
          <template v-if="$slots.suffix" #suffix><slot name="suffix" /></template>
          <template v-if="$slots['clear-icon']" #clear-icon><slot name="clear-icon" /></template>
        </ComboboxControl>

        <ComboboxListbox
          :id="listboxId"
          :options="options"
          :model-value="model"
          :active-value="activeValue"
          :loading="props.loading"
          :loading-label="props.loadingLabel"
          :error="props.error"
          :empty-label="props.emptyLabel"
          :disabled="props.disabled"
          density="touch"
          feedback-role="region"
          :aria-label="fieldAriaLabel"
          :aria-labelledby="undefined"
          @activate="setActive"
          @select="commitOption"
        >
          <template v-if="$slots.option" #option="slotProps: ComboboxOptionSlotProps">
            <slot name="option" v-bind="slotProps" />
          </template>
          <template v-if="$slots.loading" #loading="slotProps: ComboboxFeedbackSlotProps">
            <slot name="loading" v-bind="slotProps" />
          </template>
          <template v-if="$slots.empty" #empty="slotProps: ComboboxFeedbackSlotProps">
            <slot name="empty" v-bind="slotProps" />
          </template>
          <template v-if="$slots.error" #error="slotProps: ComboboxFeedbackSlotProps">
            <slot name="error" v-bind="slotProps" />
          </template>
        </ComboboxListbox>
      </div>
    </BottomSheet>
  </template>
</template>
