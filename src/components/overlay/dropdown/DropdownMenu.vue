<!-- src/components/overlay/dropdown/DropdownMenu.vue -->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, provide, ref, watch, type HTMLAttributes } from "vue";

import type { AnchoredPlacement } from "../internal/anchored-position.types";
import Popover from "../popover/Popover.vue";
import { DROPDOWN_MENU_CONTEXT } from "./dropdown.context";

interface PopoverExpose {
  close: () => void;
  focusAdjacentToTrigger: (backwards?: boolean) => boolean;
}

const props = withDefaults(
  defineProps<{
    label: string;
    placement?: AnchoredPlacement;
    offset?: number;
    collisionPadding?: number;
    disabled?: boolean;
    interaction?: "click" | "hover" | "both";
    openDelay?: number;
    closeDelay?: number;
    loop?: boolean;
    contentClass?: HTMLAttributes["class"];
    teleportTo?: string | HTMLElement;
  }>(),
  {
    placement: "bottom-start",
    offset: 12,
    collisionPadding: 8,
    disabled: false,
    interaction: "click",
    openDelay: 0,
    closeDelay: 120,
    loop: true,
    contentClass: undefined,
    teleportTo: "body",
  },
);

const model = defineModel<boolean>({ default: false });
const emit = defineEmits<{
  "open-change": [open: boolean];
}>();

defineSlots<{
  trigger(props: { attrs: Record<string, unknown>; open: boolean }): unknown;
  default(props: { close: () => void }): unknown;
}>();

const popoverRef = ref<PopoverExpose | null>(null);
const menuElement = ref<HTMLElement | null>(null);
let openTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;
let focusIntent: "first" | "last" | null = null;
let typeahead = "";
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

const close = () => {
  if (model.value && popoverRef.value) popoverRef.value.close();
  else model.value = false;
};

provide(DROPDOWN_MENU_CONTEXT, { close });

const items = () =>
  Array.from(
    menuElement.value?.querySelectorAll<HTMLButtonElement>(
      "[data-dropdown-menu-item]:not(:disabled)",
    ) ?? [],
  );

const focusItem = (index: number): boolean => {
  const candidates = items();
  const target = candidates[index];
  if (!target) return false;
  for (const item of candidates) item.tabIndex = item === target ? 0 : -1;
  target.focus({ preventScroll: true });
  return target.ownerDocument.activeElement === target;
};

const moveFocus = (direction: 1 | -1) => {
  const candidates = items();
  if (candidates.length === 0) return;
  const activeIndex = candidates.indexOf(
    menuElement.value?.ownerDocument.activeElement as HTMLButtonElement,
  );
  let next = activeIndex + direction;
  if (props.loop) next = (next + candidates.length) % candidates.length;
  else next = Math.min(Math.max(next, 0), candidates.length - 1);
  focusItem(next);
};

const clearOpenTimer = () => {
  if (openTimer === undefined) return;
  clearTimeout(openTimer);
  openTimer = undefined;
};

const clearCloseTimer = () => {
  if (closeTimer === undefined) return;
  clearTimeout(closeTimer);
  closeTimer = undefined;
};

const clearTypeahead = () => {
  typeahead = "";
  if (typeaheadTimer !== undefined) clearTimeout(typeaheadTimer);
  typeaheadTimer = undefined;
};

const hoverEnabled = () => props.interaction === "hover" || props.interaction === "both";

const handlePointerEnter = (event: PointerEvent) => {
  if (!hoverEnabled() || event.pointerType === "touch" || props.disabled) return;
  clearCloseTimer();
  clearOpenTimer();
  openTimer = setTimeout(
    () => {
      model.value = true;
      openTimer = undefined;
    },
    Math.max(0, props.openDelay),
  );
};

const handlePointerLeave = (event: PointerEvent) => {
  if (!hoverEnabled() || event.pointerType === "touch") return;
  clearOpenTimer();
  clearCloseTimer();
  closeTimer = setTimeout(
    () => {
      model.value = false;
      closeTimer = undefined;
    },
    Math.max(0, props.closeDelay),
  );
};

const handleTriggerKeydown = (event: KeyboardEvent) => {
  if (props.disabled || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;

  event.preventDefault();
  focusIntent = event.key === "ArrowUp" ? "last" : "first";
  model.value = true;
  if (menuElement.value) {
    const focused = focusItem(focusIntent === "last" ? items().length - 1 : 0);
    if (focused) focusIntent = null;
  }
};

const decorateTriggerAttrs = (attrs: Record<string, unknown>) => {
  const originalClick = attrs.onClick as (() => void) | undefined;
  return {
    ...attrs,
    "aria-haspopup": "menu",
    onClick: () => {
      if (!model.value) focusIntent = "first";
      originalClick?.();
    },
    onKeydown: handleTriggerKeydown,
    onPointerenter: handlePointerEnter,
    onPointerleave: handlePointerLeave,
  };
};

const handleMenuKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      moveFocus(1);
      return;
    case "ArrowUp":
      event.preventDefault();
      moveFocus(-1);
      return;
    case "Home":
      event.preventDefault();
      focusItem(0);
      return;
    case "End":
      event.preventDefault();
      focusItem(items().length - 1);
      return;
    case "Tab": {
      event.preventDefault();
      const backwards = event.shiftKey;
      focusIntent = null;
      model.value = false;
      void nextTick(() => popoverRef.value?.focusAdjacentToTrigger(backwards));
      return;
    }
    default:
      break;
  }

  if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
  typeahead += event.key.toLocaleLowerCase();
  if (typeaheadTimer !== undefined) clearTimeout(typeaheadTimer);
  typeaheadTimer = setTimeout(clearTypeahead, 500);

  const candidates = items();
  const match = candidates.find((item) =>
    (item.dataset.textValue ?? item.textContent ?? "")
      .trim()
      .toLocaleLowerCase()
      .startsWith(typeahead),
  );
  if (match) focusItem(candidates.indexOf(match));
};

const handleFocusin = (event: FocusEvent) => {
  const candidates = items();
  const target = candidates.find((item) => item === event.target);
  if (!target) return;
  for (const item of candidates) item.tabIndex = item === target ? 0 : -1;
};

const handlePopoverReady = () => {
  if (!model.value || !focusIntent) return;
  const index = focusIntent === "last" ? items().length - 1 : 0;
  if (focusItem(index)) focusIntent = null;
};

watch(model, (open) => {
  emit("open-change", open);
  if (!open) {
    focusIntent = null;
    clearTypeahead();
  }
});

onBeforeUnmount(() => {
  clearOpenTimer();
  clearCloseTimer();
  clearTypeahead();
});

defineExpose({ close });
</script>

<template>
  <Popover
    ref="popoverRef"
    v-model="model"
    :placement="props.placement"
    :offset="props.offset"
    :collision-padding="props.collisionPadding"
    :disabled="props.disabled"
    :teleport-to="props.teleportTo"
    :auto-focus="false"
    role="presentation"
    :panel-class="[
      'flex min-w-36 max-h-[var(--ohmyui-available-height)] flex-col overflow-hidden p-2',
      props.contentClass,
    ]"
    @ready="handlePopoverReady"
  >
    <template #trigger="{ attrs, open }">
      <slot name="trigger" :attrs="decorateTriggerAttrs(attrs)" :open="open" />
    </template>

    <div
      ref="menuElement"
      role="menu"
      :aria-label="props.label"
      class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto outline-none"
      @keydown="handleMenuKeydown"
      @focusin="handleFocusin"
      @pointerenter="handlePointerEnter"
      @pointerleave="handlePointerLeave"
    >
      <slot :close="close" />
    </div>
  </Popover>
</template>
