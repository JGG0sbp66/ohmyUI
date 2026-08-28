<!-- src/components/overlay/Tooltip.vue -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from "vue";
import type { ComponentPublicInstance, CSSProperties, HTMLAttributes } from "vue";

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
  openDelay: 250,
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
const triggerElement = ref<HTMLElement | null>(null);
const tooltipElement = ref<HTMLElement | null>(null);
const hovered = ref(false);
const focused = ref(false);
const pinned = ref(false);
const dismissedWhileFocused = ref(false);
const positioned = ref(false);
const resolvedPlacement = ref<Placement>(props.placement);
const themeScope = ref<"light" | "dark" | undefined>();
const position = ref({ top: 0, left: 0, arrowLeft: 12 });

let openTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;
let resizeObserver: ResizeObserver | undefined;

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

const setTriggerRef = (target: TriggerTarget) => {
  if (target instanceof HTMLElement) {
    triggerElement.value = target;
    return;
  }

  const componentElement = target && "$el" in target ? target.$el : null;
  triggerElement.value = componentElement instanceof HTMLElement ? componentElement : null;
};

const openFromHover = () => {
  if (props.disabled) return;
  dismissedWhileFocused.value = false;
  hovered.value = true;
};

const handlePointerEnter = (event: PointerEvent) => {
  if (event.pointerType === "touch" || props.disabled) return;
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
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (triggerElement.value?.contains(target) || tooltipElement.value?.contains(target)) return;
  dismiss();
};

const handleDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Escape") return;
  dismiss();
};

const updateThemeScope = () => {
  const scope = triggerElement.value?.closest(".light, .dark");
  themeScope.value = scope?.classList.contains("dark")
    ? "dark"
    : scope?.classList.contains("light")
      ? "light"
      : undefined;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const updatePosition = () => {
  const trigger = triggerElement.value;
  const tooltip = tooltipElement.value;
  if (!isOpen.value || !trigger || !tooltip) return;

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
};

const stopPositionTracking = () => {
  window.removeEventListener("resize", updatePosition);
  window.removeEventListener("scroll", updatePosition, true);
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  document.removeEventListener("keydown", handleDocumentKeydown);
  resizeObserver?.disconnect();
  resizeObserver = undefined;
};

const startPositionTracking = () => {
  stopPositionTracking();
  window.addEventListener("resize", updatePosition);
  window.addEventListener("scroll", updatePosition, true);
  document.addEventListener("keydown", handleDocumentKeydown);
  if (props.openOnClick) {
    document.addEventListener("pointerdown", handleDocumentPointerDown);
  }

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(updatePosition);
    if (triggerElement.value) resizeObserver.observe(triggerElement.value);
    if (tooltipElement.value) resizeObserver.observe(tooltipElement.value);
  }
};

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
  async (open) => {
    emit("open-change", open);

    if (!open) {
      stopPositionTracking();
      return;
    }

    positioned.value = false;
    await nextTick();
    if (!isOpen.value) return;
    updatePosition();
    startPositionTracking();
  },
  { flush: "post" },
);

watch(
  () => [props.content, props.placement, props.offset],
  async () => {
    if (!isOpen.value) return;
    positioned.value = false;
    await nextTick();
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
  clearTimers();
  stopPositionTracking();
});
</script>

<template>
  <slot name="trigger" :attrs="triggerAttrs" :open="isOpen" />

  <Teleport to="body">
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

        <span
          aria-hidden="true"
          :class="[
            'absolute z-0 size-2 bg-bg-card',
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
