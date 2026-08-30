<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

import type { SelectionDensity } from "../../internal/selection/selection.types";
import SelectionOptionRow from "../../internal/selection/SelectionOptionRow.vue";
import type { SelectFocusIntent, SelectGroup, SelectOption, SelectValue } from "../select.types";

interface RenderEntry {
  id: string;
  index: number;
  key: string;
  value: SelectValue | null;
  label: string;
  textValue: string;
  disabled: boolean;
  option: SelectOption | null;
}

interface RenderGroup {
  key: string;
  label?: string;
  labelId: string;
  entries: RenderEntry[];
}

const props = withDefaults(
  defineProps<{
    id: string;
    modelValue: SelectValue | null;
    groups: readonly SelectGroup[];
    clearable?: boolean;
    clearLabel?: string;
    emptyLabel?: string;
    disabled?: boolean;
    density?: SelectionDensity;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaRequired?: boolean;
    ariaInvalid?: boolean;
    ariaDescribedby?: string;
    ariaErrormessage?: string;
    closeOnTab?: boolean;
  }>(),
  {
    clearable: false,
    clearLabel: "清除选择",
    emptyLabel: "暂无可选项",
    disabled: false,
    density: "compact",
    ariaLabel: undefined,
    ariaLabelledby: undefined,
    ariaRequired: false,
    ariaInvalid: false,
    ariaDescribedby: undefined,
    ariaErrormessage: undefined,
    closeOnTab: false,
  },
);

const emit = defineEmits<{
  select: [value: SelectValue | null];
  tab: [event: KeyboardEvent];
}>();

const listboxRef = ref<HTMLElement | null>(null);
const activeIndex = ref(-1);
let typeahead = "";
let typeaheadTimer: number | undefined;

const collection = computed(() => {
  let index = 0;
  const flat: RenderEntry[] = [];
  const hasOptions = props.groups.some((group) => group.options.length > 0);
  const showClear = props.clearable && (hasOptions || props.modelValue !== null);
  const clearEntry: RenderEntry | null = showClear
    ? {
        id: `${props.id}-option-${index}`,
        index: index++,
        key: "__clear__",
        value: null,
        label: props.clearLabel,
        textValue: props.clearLabel.toLocaleLowerCase(),
        disabled: props.disabled,
        option: null,
      }
    : null;
  if (clearEntry) flat.push(clearEntry);

  const groups: RenderGroup[] = props.groups.map((group, groupIndex) => {
    const entries = group.options.map((option, optionIndex): RenderEntry => {
      const entry: RenderEntry = {
        id: `${props.id}-option-${index}`,
        index: index++,
        key: `${group.key}-${String(option.value)}-${optionIndex}`,
        value: option.value,
        label: option.label,
        textValue: (option.textValue ?? option.label).trim().toLocaleLowerCase(),
        disabled: props.disabled || Boolean(option.disabled),
        option,
      };
      flat.push(entry);
      return entry;
    });

    return {
      key: group.key,
      label: group.label,
      labelId: `${props.id}-group-${groupIndex}`,
      entries,
    };
  });

  return { clearEntry, groups, flat, hasOptions };
});

const activeEntry = computed(
  () => collection.value.flat.find((entry) => entry.index === activeIndex.value) ?? null,
);

function isSelected(entry: RenderEntry): boolean {
  return Object.is(entry.value, props.modelValue);
}

function enabledEntries(): RenderEntry[] {
  return collection.value.flat.filter((entry) => !entry.disabled);
}

function selectedEnabledEntry(): RenderEntry | undefined {
  return collection.value.flat.find((entry) => isSelected(entry) && !entry.disabled);
}

function setActive(entry: RenderEntry | undefined, scroll = false): void {
  activeIndex.value = entry?.index ?? -1;
  if (!entry || !scroll) return;

  void nextTick(() => {
    listboxRef.value
      ?.querySelector<HTMLElement>(`[data-select-index="${entry.index}"]`)
      ?.scrollIntoView({ block: "nearest" });
  });
}

function syncActive(): void {
  const current = collection.value.flat.find(
    (entry) => entry.index === activeIndex.value && !entry.disabled,
  );
  setActive(current ?? selectedEnabledEntry() ?? enabledEntries()[0]);
}

function focusInitial(intent: SelectFocusIntent = "selected"): void {
  const enabled = enabledEntries();
  const target =
    intent === "first"
      ? enabled[0]
      : intent === "last"
        ? enabled.at(-1)
        : (selectedEnabledEntry() ?? enabled[0]);
  setActive(target, true);
  void nextTick(() => listboxRef.value?.focus({ preventScroll: true }));
}

function moveActive(direction: 1 | -1): void {
  const enabled = enabledEntries();
  if (enabled.length === 0) return;
  const current = enabled.findIndex((entry) => entry.index === activeIndex.value);
  const next = current < 0 ? (direction > 0 ? 0 : enabled.length - 1) : current + direction;
  setActive(enabled[(next + enabled.length) % enabled.length], true);
}

function selectEntry(entry: RenderEntry): void {
  if (entry.disabled) return;
  setActive(entry);
  emit("select", entry.value);
}

function clearTypeahead(): void {
  typeahead = "";
  if (typeaheadTimer !== undefined) window.clearTimeout(typeaheadTimer);
  typeaheadTimer = undefined;
}

function handleTypeahead(event: KeyboardEvent): void {
  if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;

  const key = event.key.toLocaleLowerCase();
  const nextTypeahead = `${typeahead}${key}`;
  const repeatsOneCharacter = [...nextTypeahead].every((character) => character === key);
  typeahead = repeatsOneCharacter ? key : nextTypeahead;
  if (typeaheadTimer !== undefined) window.clearTimeout(typeaheadTimer);
  typeaheadTimer = window.setTimeout(clearTypeahead, 500);

  const enabled = enabledEntries();
  if (enabled.length === 0) return;
  const current = enabled.findIndex((entry) => entry.index === activeIndex.value);
  const ordered = [...enabled.slice(current + 1), ...enabled.slice(0, current + 1)];
  const match = ordered.find((entry) => entry.textValue.startsWith(typeahead));
  if (match) setActive(match, true);
}

function handleKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      moveActive(1);
      return;
    case "ArrowUp":
      event.preventDefault();
      moveActive(-1);
      return;
    case "Home":
      event.preventDefault();
      setActive(enabledEntries()[0], true);
      return;
    case "End":
      event.preventDefault();
      setActive(enabledEntries().at(-1), true);
      return;
    case "Enter":
    case " ":
      event.preventDefault();
      if (activeEntry.value) selectEntry(activeEntry.value);
      return;
    case "Tab":
      if (!props.closeOnTab) return;
      emit("tab", event);
      return;
    default:
      handleTypeahead(event);
  }
}

function handlePointerDown(event: PointerEvent): void {
  if (event.pointerType === "mouse") event.preventDefault();
}

watch(() => [props.modelValue, props.groups, props.clearable, props.disabled], syncActive, {
  deep: true,
  immediate: true,
  flush: "sync",
});

onBeforeUnmount(clearTypeahead);

defineExpose({ focusInitial });
</script>

<template>
  <div
    :id="props.id"
    ref="listboxRef"
    data-select-listbox
    role="listbox"
    tabindex="0"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :aria-required="props.ariaRequired || undefined"
    :aria-invalid="props.ariaInvalid ? 'true' : undefined"
    :aria-describedby="props.ariaDescribedby"
    :aria-errormessage="props.ariaErrormessage"
    :aria-activedescendant="activeEntry?.id"
    :aria-disabled="props.disabled || undefined"
    class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pb-1 outline-none"
    @focus="syncActive"
    @keydown="handleKeydown"
  >
    <SelectionOptionRow
      v-if="collection.clearEntry"
      :id="collection.clearEntry.id"
      role="option"
      :aria-selected="isSelected(collection.clearEntry)"
      :aria-disabled="collection.clearEntry.disabled || undefined"
      :data-select-index="collection.clearEntry.index"
      :active="collection.clearEntry.index === activeIndex"
      :selected="isSelected(collection.clearEntry)"
      :disabled="collection.clearEntry.disabled"
      :density="props.density"
      @pointerdown="handlePointerDown"
      @pointermove="!collection.clearEntry.disabled && setActive(collection.clearEntry)"
      @click="selectEntry(collection.clearEntry)"
    >
      <svg
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
      <span class="min-w-0 flex-1 truncate">{{ collection.clearEntry.label }}</span>
    </SelectionOptionRow>

    <div
      v-for="group in collection.groups"
      :key="group.key"
      role="group"
      :aria-labelledby="group.label ? group.labelId : undefined"
    >
      <div
        v-if="group.label"
        :id="group.labelId"
        :class="[
          'text-fg-soft select-none',
          props.density === 'touch' ? 'mt-2 px-1.5 pb-0.5 text-sm' : 'mt-1 px-1.5 pb-0.5 text-xs',
        ]"
      >
        {{ group.label }}
      </div>

      <div class="flex flex-col gap-1">
        <SelectionOptionRow
          v-for="entry in group.entries"
          :id="entry.id"
          :key="entry.key"
          role="option"
          :aria-selected="isSelected(entry)"
          :aria-disabled="entry.disabled || undefined"
          :data-select-index="entry.index"
          :active="entry.index === activeIndex"
          :selected="isSelected(entry)"
          :disabled="entry.disabled"
          :density="props.density"
          @pointerdown="handlePointerDown"
          @pointermove="!entry.disabled && setActive(entry)"
          @click="selectEntry(entry)"
        >
          <component
            :is="entry.option?.icon"
            v-if="entry.option?.icon"
            aria-hidden="true"
            :class="['size-4 shrink-0', entry.option.iconClass]"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate">{{ entry.label }}</span>
            <span
              v-if="entry.option?.description"
              class="mt-0.5 block truncate text-xs text-fg-muted"
            >
              {{ entry.option.description }}
            </span>
          </span>
        </SelectionOptionRow>
      </div>
    </div>

    <p v-if="!collection.hasOptions" class="px-3 py-6 text-center text-sm text-fg-muted">
      {{ props.emptyLabel }}
    </p>
  </div>
</template>
