<!-- src/components/overlay/dropdown/DropdownMenuItem.vue -->
<script setup lang="ts">
import { computed, inject } from "vue";

import { DROPDOWN_MENU_CONTEXT } from "./dropdown.context";

const props = withDefaults(
  defineProps<{
    text: string;
    textValue?: string;
    active?: boolean;
    disabled?: boolean;
    danger?: boolean;
    closeOnSelect?: boolean;
  }>(),
  {
    textValue: undefined,
    active: false,
    disabled: false,
    danger: false,
    closeOnSelect: true,
  },
);

const emit = defineEmits<{
  select: [event: MouseEvent];
}>();

defineSlots<{
  icon?: () => unknown;
  suffix?: () => unknown;
}>();

const menu = inject(DROPDOWN_MENU_CONTEXT, null);
const stateClass = computed(() => {
  if (props.danger) return "text-danger enabled:hover:text-danger";
  return props.active
    ? "text-fg-subtle before:scale-100 before:opacity-100"
    : "text-fg enabled:hover:text-fg-subtle";
});

const handleClick = (event: MouseEvent) => {
  if (props.disabled) return;
  emit("select", event);
  if (!event.defaultPrevented && props.closeOnSelect) menu?.close();
};
</script>

<template>
  <button
    type="button"
    role="menuitem"
    data-dropdown-menu-item
    :data-text-value="(props.textValue ?? props.text).toLocaleLowerCase()"
    :disabled="props.disabled"
    :aria-disabled="props.disabled || undefined"
    tabindex="-1"
    :class="[
      'relative isolate flex w-full cursor-pointer items-center justify-start gap-2 overflow-hidden rounded-lg bg-transparent px-3 py-1.5 text-left text-sm transition-[color,opacity,scale]',
      'before:absolute before:inset-0 before:-z-10 before:scale-90 before:rounded-[inherit] before:bg-bg-muted before:opacity-0 before:transition-[opacity,scale] before:content-[\'\']',
      'enabled:hover:before:scale-100 enabled:hover:before:opacity-100 enabled:active:scale-[0.98]',
      'disabled:cursor-not-allowed disabled:text-fg-muted disabled:opacity-50 motion-reduce:transition-none motion-reduce:before:transition-none',
      stateClass,
    ]"
    @click="handleClick"
  >
    <span
      v-if="$slots.icon"
      aria-hidden="true"
      class="flex size-4 shrink-0 items-center justify-center"
    >
      <slot name="icon" />
    </span>
    <span class="min-w-0 flex-1 truncate">{{ props.text }}</span>
    <span v-if="$slots.suffix" class="ml-auto flex shrink-0 items-center">
      <slot name="suffix" />
    </span>
  </button>
</template>
