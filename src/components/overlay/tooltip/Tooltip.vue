<!-- src/components/overlay/tooltip/Tooltip.vue -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, useId, watch } from "vue";
import type { ComponentPublicInstance, CSSProperties, HTMLAttributes } from "vue";

import { registerDismissableLayer } from "../internal/dismissable-layer";

defineOptions({ inheritAttrs: false });

type Placement = "top" | "bottom";
type TriggerTarget = Element | ComponentPublicInstance | null;

interface TooltipTriggerAttrs extends Record<string, unknown> {
  ref: (target: TriggerTarget) => void;
  "aria-describedby"?: string;
  onPointerenter: (event: PointerEvent) => void;
  onPointerleave: (event: PointerEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  onClick?: () => void;
}

interface Props {
  /** 纯文本提示；需要自定义内容时使用默认 slot。 */
  content: string;
  placement?: Placement;
  /** 触发器与箭头尖端之间的像素距离。 */
  offset?: number;
  /** 仅作用于细指针 hover；键盘 focus 始终立即显示。 */
  openDelay?: number;
  closeDelay?: number;
  /** 开启后可点击固定提示，供触屏和 HelpTooltip 使用。 */
  openOnClick?: boolean;
  disabled?: boolean;
  /** 调整提示内容卡片，而不是定位外壳。 */
  contentClass?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
  placement: "top",
  offset: 8,
  openDelay: 0,
  closeDelay: 80,
  openOnClick: false,
  disabled: false,
  contentClass: undefined,
});

const emit = defineEmits<{
  "open-change": [open: boolean];
}>();

defineSlots<{
  trigger(props: { attrs: TooltipTriggerAttrs; open: boolean }): unknown;
  default?(): unknown;
}>();

const tooltipId = `tooltip-${useId()}`;
const tooltipLayerId = Symbol("ohmyui-tooltip");
const triggerElement = ref<HTMLElement | null>(null);
const tooltipElement = ref<HTMLElement | null>(null);
const teleportTarget = shallowRef<string | HTMLElement>("body");
const hovered = ref(false);
const focused = ref(false);
const pinned = ref(false);
const dismissedWhileFocused = ref(false);
const positioned = ref(false);
const resolvedPlacement = ref<Placement>(props.placement);
const themeScope = ref<"light" | "dark" | undefined>();
const dialogOwnerId = ref<string | undefined>();
const position = ref({ top: 0, left: 0, arrowLeft: 12 });

let openTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;
let resizeObserver: ResizeObserver | undefined;
let unregisterDismissableLayer: (() => void) | undefined;
let activeDocument: Document | null = null;
let activeWindow: Window | null = null;
let activationGeneration = 0;
let disposed = false;

const isOpen = computed(
  () =>
    !props.disabled &&
    (hovered.value || (focused.value && !dismissedWhileFocused.value) || pinned.value),
);

const tooltipStyle = computed<CSSProperties>(() => ({
  top: `${position.value.top}px`,
  left: `${position.value.left}px`,
  visibility: positioned.value ? "visible" : "hidden",
}));

const arrowStyle = computed<CSSProperties>(() => ({
  left: `${position.value.arrowLeft}px`,
  transform: "translateX(-50%) rotate(45deg)",
}));

function isHtmlElement(value: unknown): value is HTMLElement {
  if (!value || typeof value !== "object") return false;
  const element = value as Element;
  if (
    element.nodeType !== 1 ||
    element.namespaceURI !== "http://www.w3.org/1999/xhtml" ||
    !element.ownerDocument
  ) {
    return false;
  }

  const HTMLElementConstructor = element.ownerDocument.defaultView?.HTMLElement;
  return HTMLElementConstructor ? value instanceof HTMLElementConstructor : true;
}

function isNodeForDocument(value: unknown, document: Document): value is Node {
  const NodeConstructor = document.defaultView?.Node;
  if (NodeConstructor) return value instanceof NodeConstructor;
  return Boolean(value && typeof value === "object" && "nodeType" in value);
}

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

const clearTimers = () => {
  clearOpenTimer();
  clearCloseTimer();
};

function resolveTriggerRealm(): { document: Document; window: Window } | null {
  const document = triggerElement.value?.ownerDocument;
  const window = document?.defaultView;
  return document && window ? { document, window } : null;
}

function syncTeleportTarget(): void {
  const body = triggerElement.value?.ownerDocument.body;
  if (body && teleportTarget.value !== body) teleportTarget.value = body;
}

const setTriggerRef = (target: TriggerTarget) => {
  const componentElement = target && "$el" in target ? target.$el : null;
  const nextTrigger = isHtmlElement(target)
    ? target
    : isHtmlElement(componentElement)
      ? componentElement
      : null;
  const changed = triggerElement.value !== nextTrigger;

  triggerElement.value = nextTrigger;
  syncTeleportTarget();
  if (changed && isOpen.value) void activatePositionTracking();
};

const openFromHover = () => {
  if (props.disabled) return;
  syncTeleportTarget();
  dismissedWhileFocused.value = false;
  hovered.value = true;
};

const handlePointerEnter = (event: PointerEvent) => {
  if (event.pointerType === "touch" || props.disabled) return;
  syncTeleportTarget();
  clearCloseTimer();
  clearOpenTimer();

  if (props.openDelay <= 0) {
    openFromHover();
    return;
  }

  openTimer = setTimeout(openFromHover, props.openDelay);
};

const handlePointerLeave = (event: PointerEvent) => {
  if (event.pointerType === "touch") return;
  clearOpenTimer();
  clearCloseTimer();

  if (props.closeDelay <= 0) {
    hovered.value = false;
    return;
  }

  closeTimer = setTimeout(() => {
    hovered.value = false;
  }, props.closeDelay);
};

const handleFocus = () => {
  if (props.disabled) return;
  syncTeleportTarget();
  clearTimers();
  dismissedWhileFocused.value = false;
  focused.value = true;
};

const handleBlur = () => {
  focused.value = false;
  dismissedWhileFocused.value = false;
};

const handleClick = () => {
  if (!props.openOnClick || props.disabled) return;
  syncTeleportTarget();

  if (pinned.value) {
    pinned.value = false;
    hovered.value = false;
    dismissedWhileFocused.value = true;
    return;
  }

  dismissedWhileFocused.value = false;
  pinned.value = true;
};

const dismiss = () => {
  clearTimers();
  hovered.value = false;
  pinned.value = false;
  dismissedWhileFocused.value = focused.value;
};

const handleDocumentPointerDown = (event: PointerEvent) => {
  const document = activeDocument;
  const target = event.target;
  if (!document || !isNodeForDocument(target, document)) return;
  if (triggerElement.value?.contains(target) || tooltipElement.value?.contains(target)) return;
  dismiss();
};

const updateThemeScope = () => {
  const trigger = triggerElement.value;
  const scope = trigger?.closest(".light, .dark");
  const dialogOwner = trigger?.closest<HTMLElement>("[data-ohmyui-dialog-layer]");
  dialogOwnerId.value = dialogOwner?.dataset.ohmyuiDialogLayer;
  themeScope.value = scope?.classList.contains("dark")
    ? "dark"
    : scope?.classList.contains("light")
      ? "light"
      : undefined;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

function updatePosition(): void {
  const trigger = triggerElement.value;
  const tooltip = tooltipElement.value;
  const document = trigger?.ownerDocument;
  const window = document?.defaultView;
  if (!isOpen.value || !trigger || !tooltip || !document || !window) return;

  if (tooltip.ownerDocument !== document || (activeDocument && activeDocument !== document)) {
    void activatePositionTracking();
    return;
  }

  updateThemeScope();

  const triggerRect = trigger.getBoundingClientRect();
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  if (tooltipWidth === 0 || tooltipHeight === 0) return;

  const viewportPadding = 8;
  const arrowReach = 4;
  const panelGap = props.offset + arrowReach;
  const spaceAbove = triggerRect.top - viewportPadding;
  const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
  const requiredSpace = tooltipHeight + panelGap;

  let placement = props.placement;
  if (placement === "top" && spaceAbove < requiredSpace && spaceBelow > spaceAbove) {
    placement = "bottom";
  } else if (placement === "bottom" && spaceBelow < requiredSpace && spaceAbove > spaceBelow) {
    placement = "top";
  }

  const triggerCenter = triggerRect.left + triggerRect.width / 2;
  const maximumLeft = Math.max(viewportPadding, window.innerWidth - viewportPadding - tooltipWidth);
  const left = clamp(triggerCenter - tooltipWidth / 2, viewportPadding, maximumLeft);
  const maximumTop = Math.max(
    viewportPadding,
    window.innerHeight - viewportPadding - tooltipHeight,
  );
  const preferredTop =
    placement === "top"
      ? triggerRect.top - tooltipHeight - panelGap
      : triggerRect.bottom + panelGap;
  const top = clamp(preferredTop, viewportPadding, maximumTop);
  const arrowLeft = clamp(triggerCenter - left, 12, Math.max(12, tooltipWidth - 12));

  resolvedPlacement.value = placement;
  position.value = { top, left, arrowLeft };
  positioned.value = true;
}

function stopPositionTracking(): void {
  activeWindow?.removeEventListener("resize", updatePosition);
  activeWindow?.removeEventListener("scroll", updatePosition, true);
  activeDocument?.removeEventListener("pointerdown", handleDocumentPointerDown);
  activeDocument = null;
  activeWindow = null;

  unregisterDismissableLayer?.();
  unregisterDismissableLayer = undefined;
  resizeObserver?.disconnect();
  resizeObserver = undefined;
}

function startPositionTracking(document: Document, window: Window): void {
  activeDocument = document;
  activeWindow = window;
  window.addEventListener("resize", updatePosition);
  window.addEventListener("scroll", updatePosition, true);
  unregisterDismissableLayer = registerDismissableLayer(document, {
    id: tooltipLayerId,
    // Teleport 后的 Tooltip 只有在自身未被隔离、且所属 Dialog 仍可交互时才能占用 Escape。
    isActive: () => {
      if (!isOpen.value) return false;
      if (tooltipElement.value?.closest("[inert], [aria-hidden='true']")) return false;

      const ownerId = dialogOwnerId.value;
      if (!ownerId) return true;

      const owner = triggerElement.value?.closest<HTMLElement>("[data-ohmyui-dialog-layer]");
      return (
        owner?.dataset.ohmyuiDialogLayer === ownerId &&
        !owner.inert &&
        owner.getAttribute("aria-hidden") !== "true"
      );
    },
    onEscape: () => {
      dismiss();
      return true;
    },
  });
  if (props.openOnClick) {
    document.addEventListener("pointerdown", handleDocumentPointerDown);
  }

  type ResizeObserverWindow = Window & {
    ResizeObserver?: new (callback: ResizeObserverCallback) => ResizeObserver;
  };
  const ResizeObserverConstructor = (window as ResizeObserverWindow).ResizeObserver;
  if (ResizeObserverConstructor) {
    const observer = new ResizeObserverConstructor(updatePosition);
    resizeObserver = observer;
    if (triggerElement.value) observer.observe(triggerElement.value);
    if (tooltipElement.value) observer.observe(tooltipElement.value);
  }
}

async function activatePositionTracking(): Promise<void> {
  const generation = ++activationGeneration;
  stopPositionTracking();

  const trigger = triggerElement.value;
  const realm = resolveTriggerRealm();
  const body = realm?.document.body;
  if (!isOpen.value || !trigger || !realm || !body) return;

  teleportTarget.value = body;
  updateThemeScope();
  positioned.value = false;
  await nextTick();

  const tooltip = tooltipElement.value;
  if (
    disposed ||
    generation !== activationGeneration ||
    !isOpen.value ||
    triggerElement.value !== trigger
  ) {
    return;
  }

  if (trigger.ownerDocument !== realm.document || tooltip?.ownerDocument !== realm.document) {
    void activatePositionTracking();
    return;
  }

  updatePosition();
  startPositionTracking(realm.document, realm.window);
}

const triggerAttrs = computed<TooltipTriggerAttrs>(() => ({
  ref: setTriggerRef,
  "aria-describedby": props.disabled ? undefined : tooltipId,
  onPointerenter: handlePointerEnter,
  onPointerleave: handlePointerLeave,
  onFocus: handleFocus,
  onBlur: handleBlur,
  onClick: props.openOnClick ? handleClick : undefined,
}));

watch(
  isOpen,
  (open) => {
    emit("open-change", open);

    if (!open) {
      activationGeneration += 1;
      stopPositionTracking();
      return;
    }

    void activatePositionTracking();
  },
  { flush: "post" },
);

watch(
  () => [props.content, props.placement, props.offset],
  async () => {
    if (!isOpen.value) return;
    const generation = activationGeneration;
    positioned.value = false;
    await nextTick();
    if (generation !== activationGeneration || !isOpen.value) return;
    updatePosition();
  },
  { flush: "post" },
);

watch(
  () => props.disabled,
  (disabled) => {
    if (!disabled) return;
    focused.value = false;
    dismiss();
  },
);

onBeforeUnmount(() => {
  disposed = true;
  activationGeneration += 1;
  clearTimers();
  stopPositionTracking();
});
</script>

<template>
  <slot name="trigger" :attrs="triggerAttrs" :open="isOpen" />

  <Teleport :to="teleportTarget">
    <Transition
      enter-active-class="transition-[opacity,scale] duration-100 motion-reduce:transition-none"
      enter-from-class="scale-95 opacity-0"
      leave-active-class="transition-[opacity,scale] duration-100 motion-reduce:transition-none"
      leave-to-class="scale-95 opacity-0"
    >
      <div
        v-show="isOpen"
        :id="tooltipId"
        ref="tooltipElement"
        :data-dialog-focus-allow="dialogOwnerId"
        role="tooltip"
        :data-placement="resolvedPlacement"
        :class="[
          'pointer-events-none fixed z-[100] w-max max-w-[calc(100vw-1rem)] text-left normal-case sm:max-w-64',
          resolvedPlacement === 'top' ? 'origin-bottom' : 'origin-top',
          themeScope,
        ]"
        :style="tooltipStyle"
      >
        <div
          :class="[
            'relative z-10 rounded-lg border border-border/60 bg-bg-card px-3 py-2 text-[11px] leading-relaxed font-medium whitespace-pre-line text-fg shadow-xl',
            props.contentClass,
          ]"
        >
          <slot>{{ props.content }}</slot>
        </div>

        <!-- 箭头覆盖卡片边框，根部与气泡内部连通，只保留朝外的两条描边。 -->
        <span
          aria-hidden="true"
          :class="[
            'absolute z-20 size-2 bg-bg-card',
            resolvedPlacement === 'top'
              ? '-bottom-1 border-r border-b border-border/60'
              : '-top-1 border-t border-l border-border/60',
          ]"
          :style="arrowStyle"
        />
      </div>
    </Transition>
  </Teleport>
</template>
