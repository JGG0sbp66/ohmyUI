<!-- src/components/navigation/FilterTabs.vue -->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";

import Tag from "../tag/Tag.vue";
import type {
  FilterTabCountVisibility,
  FilterTabOption,
  FilterTabValue,
} from "./filter-tabs.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 当前筛选值；由使用者持有并通过 v-model 更新 */
    modelValue: FilterTabValue;
    /** value 在同一个选项集合中必须唯一 */
    options: readonly FilterTabOption[];
    /** 单选筛选组的无障碍名称 */
    label: string;
    disabled?: boolean;
    countVisibility?: FilterTabCountVisibility;
  }>(),
  {
    disabled: false,
    countVisibility: "active",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: FilterTabValue];
}>();

defineSlots<{
  icon?: (props: { option: FilterTabOption; selected: boolean; disabled: boolean }) => unknown;
  count?: (props: { option: FilterTabOption; selected: boolean; disabled: boolean }) => unknown;
}>();

const rootRef = ref<HTMLElement | null>(null);

const selectedIndex = computed(() =>
  props.options.findIndex((option) => Object.is(option.value, props.modelValue)),
);

const enabledIndices = computed(() =>
  props.options.reduce<number[]>((indices, option, index) => {
    if (!props.disabled && !option.disabled) indices.push(index);
    return indices;
  }, []),
);

const tabbableIndex = computed(() => {
  const selected = selectedIndex.value;
  if (selected >= 0 && enabledIndices.value.includes(selected)) return selected;
  return enabledIndices.value[0] ?? -1;
});

const isSelected = (option: FilterTabOption) => Object.is(option.value, props.modelValue);
const isDisabled = (option: FilterTabOption) => props.disabled || option.disabled === true;

const optionKey = (option: FilterTabOption, index: number) =>
  `${typeof option.value}:${String(option.value)}:${index}`;

const isCountVisible = (option: FilterTabOption) => {
  if (option.count === undefined || props.countVisibility === "never") return false;
  return props.countVisibility === "always" || isSelected(option);
};

const optionElement = (index: number) =>
  rootRef.value?.querySelector<HTMLButtonElement>(`[data-filter-tab-index="${index}"]`) ?? null;

/** 只修正组件自身的横向滚动，不让外部页面发生纵向跳动。 */
const keepOptionVisible = async (index: number) => {
  if (index < 0) return;

  await nextTick();
  const root = rootRef.value;
  const option = optionElement(index);
  if (!root || !option) return;

  const rootRect = root.getBoundingClientRect();
  const optionRect = option.getBoundingClientRect();
  const inlinePadding = 4;
  let delta = 0;

  if (optionRect.left < rootRect.left + inlinePadding) {
    delta = optionRect.left - rootRect.left - inlinePadding;
  } else if (optionRect.right > rootRect.right - inlinePadding) {
    delta = optionRect.right - rootRect.right + inlinePadding;
  }

  if (delta !== 0) root.scrollBy({ left: delta, behavior: "auto" });
};

const selectOption = (option: FilterTabOption, index: number) => {
  if (isDisabled(option)) return;
  if (!isSelected(option)) emit("update:modelValue", option.value);
  void keepOptionVisible(index);
};

const moveTo = (index: number) => {
  const option = props.options[index];
  const element = optionElement(index);
  if (!option || !element || isDisabled(option)) return;

  element.focus({ preventScroll: true });
  selectOption(option, index);
};

const onCountTransitionEnd = (event: TransitionEvent, index: number) => {
  if (
    event.target !== event.currentTarget ||
    event.propertyName !== "max-width" ||
    index !== selectedIndex.value
  ) {
    return;
  }

  void keepOptionVisible(index);
};

const adjacentEnabledIndex = (currentIndex: number, direction: 1 | -1) => {
  const indices = enabledIndices.value;
  if (indices.length === 0) return -1;

  const currentPosition = indices.indexOf(currentIndex);
  if (currentPosition < 0) return direction === 1 ? indices[0]! : indices.at(-1)!;

  return indices[(currentPosition + direction + indices.length) % indices.length]!;
};

const onOptionKeydown = (event: KeyboardEvent, index: number) => {
  const first = enabledIndices.value[0] ?? -1;
  const last = enabledIndices.value.at(-1) ?? -1;
  const rtl = rootRef.value ? getComputedStyle(rootRef.value).direction === "rtl" : false;
  let target = -1;

  switch (event.key) {
    case "ArrowRight":
      target = adjacentEnabledIndex(index, rtl ? -1 : 1);
      break;
    case "ArrowLeft":
      target = adjacentEnabledIndex(index, rtl ? 1 : -1);
      break;
    case "ArrowDown":
      target = adjacentEnabledIndex(index, 1);
      break;
    case "ArrowUp":
      target = adjacentEnabledIndex(index, -1);
      break;
    case "Home":
      target = first;
      break;
    case "End":
      target = last;
      break;
    default:
      return;
  }

  if (target < 0) return;
  event.preventDefault();
  moveTo(target);
};

watch(
  [() => props.modelValue, () => props.options],
  () => void keepOptionVisible(selectedIndex.value),
  { flush: "post" },
);

onMounted(() => void keepOptionVisible(selectedIndex.value));

const BUTTON_BASE = `
  group relative isolate inline-flex h-10 cursor-pointer items-center justify-center
  overflow-hidden rounded-lg bg-transparent px-4 text-sm text-fg
  transition-[color,opacity]
  before:absolute before:inset-0 before:-z-10 before:scale-90 before:rounded-[inherit]
  before:bg-bg-muted before:opacity-0 before:content-[''] before:transition-[opacity,scale]
  enabled:hover:text-fg-subtle enabled:hover:before:scale-100 enabled:hover:before:opacity-100
  enabled:active:before:scale-90 enabled:active:before:opacity-80
  disabled:cursor-not-allowed disabled:text-fg-muted disabled:opacity-50
  motion-reduce:transition-none motion-reduce:before:transition-none
`;
</script>

<template>
  <div
    ref="rootRef"
    v-bind="$attrs"
    role="radiogroup"
    aria-orientation="horizontal"
    :aria-label="props.label"
    :aria-disabled="props.disabled || undefined"
    class="filter-tabs flex w-full min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain pb-4"
  >
    <div
      v-for="(option, index) in props.options"
      :key="optionKey(option, index)"
      role="none"
      class="relative shrink-0"
    >
      <button
        type="button"
        role="radio"
        :data-filter-tab-index="index"
        :class="[
          BUTTON_BASE,
          isSelected(option) ? 'text-fg-subtle before:scale-100 before:opacity-100' : 'text-fg',
        ]"
        :disabled="isDisabled(option)"
        :aria-checked="isSelected(option)"
        :tabindex="index === tabbableIndex ? 0 : -1"
        @click="selectOption(option, index)"
        @keydown="onOptionKeydown($event, index)"
      >
        <span
          class="flex items-center justify-center transition-[opacity,scale] motion-reduce:transition-none"
          :class="isDisabled(option) ? undefined : 'group-active:scale-90 group-active:opacity-80'"
        >
          <span
            v-if="option.icon"
            aria-hidden="true"
            class="mr-2 flex size-4 shrink-0 items-center justify-center"
          >
            <slot
              name="icon"
              :option="option"
              :selected="isSelected(option)"
              :disabled="isDisabled(option)"
            >
              <component :is="option.icon" :class="['size-4', option.iconClass]" />
            </slot>
          </span>

          <span class="whitespace-nowrap">{{ option.label }}</span>

          <span
            v-if="option.count !== undefined"
            class="inline-flex items-center overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none"
            :class="
              isCountVisible(option) ? 'ml-1.5 max-w-8 opacity-100' : 'ml-0 max-w-0 opacity-0'
            "
            :aria-hidden="!isCountVisible(option)"
            @transitionend.self="onCountTransitionEnd($event, index)"
          >
            <slot
              name="count"
              :option="option"
              :selected="isSelected(option)"
              :disabled="isDisabled(option)"
            >
              <Tag tone="accent" size="sm" class="bg-accent/15! whitespace-nowrap tabular-nums">
                {{ option.count }}
              </Tag>
            </slot>
          </span>
        </span>
      </button>

      <span
        aria-hidden="true"
        class="absolute right-1 -bottom-3 left-1 h-0.75 rounded-t-sm transition-colors duration-200 motion-reduce:transition-none"
        :class="isSelected(option) ? 'bg-accent' : 'bg-transparent'"
      />
    </div>
  </div>
</template>

<style scoped>
.filter-tabs {
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.filter-tabs::-webkit-scrollbar {
  display: none;
}
</style>
