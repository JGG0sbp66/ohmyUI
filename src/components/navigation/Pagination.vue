<!-- src/components/navigation/Pagination.vue -->
<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "@lucide/vue";
import { computed } from "vue";

import ButtonIcon from "../button/ButtonIcon.vue";

defineOptions({ inheritAttrs: false });

type PaginationItem = number | { type: "ellipsis"; key: string };

const props = withDefaults(
  defineProps<{
    /** 当前页；有效范围是 1..totalPages */
    modelValue: number;
    /** 总页数；0 或 1 时不渲染 */
    totalPages: number;
    /** 分页导航的无障碍名称 */
    label: string;
    previousLabel: string;
    nextLabel: string;
    disabled?: boolean;
    /** 强制使用“上一页 / 当前页 / 下一页”的紧凑布局 */
    compact?: boolean;
  }>(),
  { disabled: false, compact: false },
);

const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

defineSlots<{
  previous?: () => unknown;
  next?: () => unknown;
}>();

const total = computed(() =>
  Number.isSafeInteger(props.totalPages) && props.totalPages > 0 ? props.totalPages : 0,
);

/**
 * 输入失效或总页数缩小时先安全显示最近的合法页；组件不主动回写，
 * 是否持久化修正值仍由受控状态的拥有者决定。
 */
const current = computed(() => {
  const candidate = Number.isSafeInteger(props.modelValue) ? props.modelValue : 1;
  return Math.min(Math.max(candidate, 1), Math.max(total.value, 1));
});

const pages = computed<PaginationItem[]>(() => {
  const count = total.value;
  const active = current.value;

  if (count <= 7) {
    return Array.from({ length: count }, (_, index) => index + 1);
  }

  if (active <= 4) {
    return [1, 2, 3, 4, 5, { type: "ellipsis", key: "end" }, count];
  }

  if (active >= count - 3) {
    return [
      1,
      { type: "ellipsis", key: "start" },
      count - 4,
      count - 3,
      count - 2,
      count - 1,
      count,
    ];
  }

  return [
    1,
    { type: "ellipsis", key: "start" },
    active - 1,
    active,
    active + 1,
    { type: "ellipsis", key: "end" },
    count,
  ];
});

const goTo = (page: number) => {
  if (
    props.disabled ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > total.value ||
    (page === current.value && page === props.modelValue)
  ) {
    return;
  }

  emit("update:modelValue", page);
};
</script>

<template>
  <nav v-if="total > 1" v-bind="$attrs" :aria-label="props.label">
    <ul class="m-0 flex list-none items-center justify-end gap-1.5 p-0">
      <li>
        <ButtonIcon
          :label="props.previousLabel"
          :disabled="props.disabled || current <= 1"
          class="group size-10 shrink-0 rounded-full! p-0!"
          @click="goTo(current - 1)"
        >
          <span
            aria-hidden="true"
            class="flex size-5 items-center justify-center text-fg-subtle group-disabled:text-fg-muted"
          >
            <slot name="previous">
              <ChevronLeft aria-hidden="true" class="size-5" />
            </slot>
          </span>
        </ButtonIcon>
      </li>

      <li :class="props.compact ? 'flex' : 'flex sm:hidden'">
        <span
          class="flex h-10 min-w-16 items-center justify-center rounded-full px-2 text-sm font-medium text-fg-soft tabular-nums"
        >
          {{ current }} / {{ total }}
        </span>
      </li>

      <template v-for="item in pages" :key="typeof item === 'number' ? `page-${item}` : item.key">
        <li :class="props.compact ? 'hidden' : 'hidden sm:block'">
          <ButtonIcon
            v-if="typeof item === 'number'"
            :label="String(item)"
            :is-active="item === current"
            :disabled="props.disabled"
            :aria-current="item === current ? 'page' : undefined"
            class="size-10 shrink-0 rounded-full! p-0! text-sm font-medium tabular-nums"
            @click="goTo(item)"
          >
            {{ item }}
          </ButtonIcon>
          <span
            v-else
            aria-hidden="true"
            class="flex size-10 items-center justify-center rounded-full text-sm font-medium text-fg-soft"
          >
            …
          </span>
        </li>
      </template>

      <li>
        <ButtonIcon
          :label="props.nextLabel"
          :disabled="props.disabled || current >= total"
          class="group size-10 shrink-0 rounded-full! p-0!"
          @click="goTo(current + 1)"
        >
          <span
            aria-hidden="true"
            class="flex size-5 items-center justify-center text-fg-subtle group-disabled:text-fg-muted"
          >
            <slot name="next">
              <ChevronRight aria-hidden="true" class="size-5" />
            </slot>
          </span>
        </ButtonIcon>
      </li>
    </ul>
  </nav>
</template>
