<!-- src/components/overlay/popover/Popover.vue -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useId,
  watch,
  type ComponentPublicInstance,
  type HTMLAttributes,
} from "vue";

import { isElementAvailable, tryFocusElement } from "../dialog/internal/dialog-dom";
import { useDialogSession } from "../dialog/internal/use-dialog-session";
import type { AnchoredPlacement } from "../internal/anchored-position.types";
import { isDialogOwnerInteractive, resolveDialogOwnerId } from "../internal/dialog-owner";
import { registerDismissableLayer } from "../internal/dismissable-layer";
import { useAnchoredPosition } from "../internal/use-anchored-position";

defineOptions({ inheritAttrs: false });

type TriggerTarget = Element | ComponentPublicInstance | null;
export type PopoverDismissReason = "trigger" | "outside" | "escape" | "close";

interface PopoverTriggerAttrs extends Record<string, unknown> {
  ref: (target: TriggerTarget) => void;
  id: string;
  "aria-haspopup": "dialog";
  "aria-expanded": boolean;
  "aria-controls": string;
  onClick: () => void;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const props = withDefaults(
  defineProps<{
    placement?: AnchoredPlacement;
    offset?: number;
    collisionPadding?: number;
    flip?: boolean;
    shift?: boolean;
    disabled?: boolean;
    closeOnOutside?: boolean;
    closeOnEscape?: boolean;
    autoFocus?: boolean;
    initialFocus?: string;
    returnFocus?: boolean;
    teleportTo?: string | HTMLElement;
    role?: "dialog" | "group" | "presentation";
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    panelClass?: HTMLAttributes["class"];
    panelStyle?: HTMLAttributes["style"];
  }>(),
  {
    placement: "bottom-start",
    offset: 8,
    collisionPadding: 8,
    flip: true,
    shift: true,
    disabled: false,
    closeOnOutside: true,
    closeOnEscape: true,
    autoFocus: true,
    initialFocus: undefined,
    returnFocus: true,
    teleportTo: "body",
    role: "dialog",
    ariaLabel: undefined,
    ariaLabelledby: undefined,
    ariaDescribedby: undefined,
    panelClass: undefined,
    panelStyle: undefined,
  },
);

const model = defineModel<boolean>({ default: false });
const emit = defineEmits<{
  "open-change": [open: boolean];
  dismiss: [reason: PopoverDismissReason];
  /** 已完成定位、模态 owner 标记与首帧提交，可安全执行菜单聚焦。 */
  ready: [];
}>();

defineSlots<{
  trigger(props: { attrs: PopoverTriggerAttrs; open: boolean }): unknown;
  default(props: { close: () => void; placement: AnchoredPlacement }): unknown;
}>();

const triggerId = `ohmyui-popover-trigger-${useId()}`;
const panelId = `ohmyui-popover-panel-${useId()}`;
const layerId = Symbol("ohmyui-popover");
const triggerElement = ref<HTMLElement | null>(null);
const panelElement = ref<HTMLElement | null>(null);
const dialogOwnerId = ref<string>();

const session = useDialogSession({
  originRef: triggerElement,
  teleportTo: () => props.teleportTo,
});
const { resolvedTeleportTarget, themeScope, themeStyle } = session;

const anchored = useAnchoredPosition({
  reference: triggerElement,
  floating: panelElement,
  placement: () => props.placement,
  offset: () => props.offset,
  collisionPadding: () => props.collisionPadding,
  flip: () => props.flip,
  shift: () => props.shift,
});
const { floatingStyle, snapshot } = anchored;
const resolvedPlacement = computed(() => snapshot.value?.placement ?? props.placement);

let unregisterLayer: (() => void) | undefined;
let activeDocument: Document | null = null;
let activationGeneration = 0;
let disposed = false;

function isHtmlElement(value: unknown): value is HTMLElement {
  if (!value || typeof value !== "object") return false;
  const element = value as Element;
  const constructor = element.ownerDocument?.defaultView?.HTMLElement;
  return element.nodeType === 1 && (constructor ? value instanceof constructor : true);
}

function setTriggerRef(target: TriggerTarget): void {
  const componentElement = target && "$el" in target ? target.$el : null;
  const next = isHtmlElement(target)
    ? target
    : isHtmlElement(componentElement)
      ? componentElement
      : null;
  const changed = triggerElement.value !== next;
  triggerElement.value = next;
  if (changed && model.value) void activate();
}

function unregisterActiveLayer(): void {
  unregisterLayer?.();
  unregisterLayer = undefined;
  activeDocument = null;
}

function focusTrigger(): boolean {
  return tryFocusElement(triggerElement.value);
}

function requestDismiss(reason: PopoverDismissReason): void {
  if (!model.value) return;
  emit("dismiss", reason);
  model.value = false;

  if (props.returnFocus && (reason === "escape" || reason === "close")) {
    void nextTick(() => {
      if (!model.value) focusTrigger();
    });
  }
}

function close(): void {
  requestDismiss("close");
}

function toggleFromTrigger(): void {
  if (props.disabled) return;
  if (model.value) requestDismiss("trigger");
  else model.value = true;
}

function focusInitialPanel(): void {
  if (!props.autoFocus || props.role !== "dialog") return;
  const panel = panelElement.value;
  if (!panel) return;

  let requested: HTMLElement | null = null;
  if (props.initialFocus) {
    try {
      requested = panel.querySelector<HTMLElement>(props.initialFocus);
    } catch {
      requested = null;
    }
  }

  const candidates = [
    requested,
    panel.querySelector<HTMLElement>("[autofocus]"),
    Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).find(isElementAvailable) ??
      null,
    panel,
  ];
  const visited = new Set<HTMLElement>();
  for (const candidate of candidates) {
    if (!candidate || visited.has(candidate)) continue;
    visited.add(candidate);
    if (tryFocusElement(candidate)) return;
  }
}

function focusAdjacentToTrigger(backwards = false): boolean {
  const trigger = triggerElement.value;
  const panel = panelElement.value;
  if (!trigger) return false;

  const candidates = Array.from(
    trigger.ownerDocument.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => isElementAvailable(element) && !panel?.contains(element));
  const index = candidates.findIndex(
    (candidate) => candidate === trigger || candidate.contains(trigger),
  );
  const target = index < 0 ? null : candidates[index + (backwards ? -1 : 1)];
  return tryFocusElement(target ?? null);
}

async function waitForCommittedFrame(panel: HTMLElement): Promise<void> {
  await nextTick();
  const view = panel.ownerDocument.defaultView;
  if (!view) return;
  await new Promise<void>((resolve) => view.requestAnimationFrame(() => resolve()));
}

async function activate(): Promise<void> {
  const generation = ++activationGeneration;
  const sessionGeneration = session.beginOpenAttempt();
  unregisterActiveLayer();
  anchored.stop();
  await nextTick();

  const trigger = triggerElement.value;
  const panel = panelElement.value;
  if (
    disposed ||
    generation !== activationGeneration ||
    !session.isCurrentAttempt(sessionGeneration) ||
    !model.value ||
    !trigger ||
    !panel
  ) {
    return;
  }

  session.captureThemeContext();
  dialogOwnerId.value = resolveDialogOwnerId(trigger);
  activeDocument = panel.ownerDocument;
  anchored.start();
  unregisterLayer = registerDismissableLayer(activeDocument, {
    id: layerId,
    isActive: () => {
      const currentPanel = panelElement.value;
      if (!model.value || !currentPanel) return false;
      if (currentPanel.closest("[inert], [aria-hidden='true']")) return false;
      return isDialogOwnerInteractive(currentPanel.ownerDocument, dialogOwnerId.value);
    },
    getContainers: () => [triggerElement.value, panelElement.value],
    onEscape: () => {
      if (!props.closeOnEscape) return false;
      requestDismiss("escape");
      return true;
    },
    // closeOnOutside=false 时保留 no-op，明确阻断同一次 pointer 下穿到父模态。
    onPointerDownOutside: () => {
      if (props.closeOnOutside) requestDismiss("outside");
    },
  });

  await waitForCommittedFrame(panel);
  if (
    disposed ||
    generation !== activationGeneration ||
    !session.isCurrentAttempt(sessionGeneration) ||
    !model.value ||
    panelElement.value !== panel
  ) {
    return;
  }

  focusInitialPanel();
  emit("ready");
}

function finishLeave(): void {
  if (model.value) return;
  anchored.clear();
  session.clearThemeContext();
  session.releaseTeleportTarget();
  dialogOwnerId.value = undefined;
}

const triggerAttrs = computed<PopoverTriggerAttrs>(() => ({
  ref: setTriggerRef,
  id: triggerId,
  "aria-haspopup": "dialog",
  "aria-expanded": model.value,
  "aria-controls": panelId,
  onClick: toggleFromTrigger,
}));

watch(
  model,
  (open) => {
    emit("open-change", open);
    if (open) {
      session.lockTeleportTarget();
      void activate();
    } else {
      activationGeneration += 1;
      session.invalidateAttempt();
      unregisterActiveLayer();
      anchored.pause();
    }
  },
  { immediate: true, flush: "post" },
);

watch(
  () => [props.placement, props.offset, props.collisionPadding, props.flip, props.shift],
  () => {
    if (model.value) anchored.update();
  },
);

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) requestDismiss("close");
  },
);

onBeforeUnmount(() => {
  disposed = true;
  activationGeneration += 1;
  unregisterActiveLayer();
  anchored.stop();
  session.dispose();
  session.clearThemeContext();
  session.releaseTeleportTarget();
});

defineExpose({
  close,
  focusAdjacentToTrigger,
  focusTrigger,
  getTriggerElement: () => triggerElement.value,
  updatePosition: anchored.update,
});
</script>

<template>
  <slot name="trigger" :attrs="triggerAttrs" :open="model" />

  <Teleport :to="resolvedTeleportTarget">
    <Transition name="popover" appear @after-leave="finishLeave">
      <div
        v-if="model"
        v-bind="$attrs"
        :id="panelId"
        ref="panelElement"
        data-ohmyui-popover-panel
        :data-dialog-focus-allow="dialogOwnerId"
        :data-placement="resolvedPlacement"
        :role="props.role"
        :aria-label="props.role === 'presentation' ? undefined : props.ariaLabel"
        :aria-labelledby="props.role === 'presentation' ? undefined : props.ariaLabelledby"
        :aria-describedby="props.role === 'presentation' ? undefined : props.ariaDescribedby"
        tabindex="-1"
        :class="[
          'fixed z-[100] rounded-lg border border-border/40 bg-bg-card text-fg shadow-lg outline-none',
          themeScope,
          props.panelClass,
        ]"
        :style="[themeStyle, props.panelStyle, floatingStyle]"
      >
        <slot :close="close" :placement="resolvedPlacement" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.popover-enter-active {
  transition:
    opacity 0.2s ease-out,
    transform 0.2s ease-out;
}

.popover-leave-active {
  transition:
    opacity 0.15s ease-in,
    transform 0.15s ease-in;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

[data-ohmyui-popover-panel][inert],
[data-ohmyui-popover-panel][aria-hidden="true"] {
  visibility: hidden !important;
  pointer-events: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .popover-enter-active,
  .popover-leave-active {
    transition: none;
  }
}
</style>
