import { computed, nextTick, onBeforeUnmount, ref, watch, type CSSProperties, type Ref } from "vue";

interface UseBottomSheetMotionOptions {
  motionRef: Ref<HTMLElement | null>;
  open: () => boolean;
  enabled: () => boolean;
  onDismiss: () => void;
  onExpandedChange: (expanded: boolean) => void;
}

type BottomSheetMotionStyle = CSSProperties & {
  "--ohmyui-bottom-sheet-height"?: string;
  "--ohmyui-bottom-sheet-y"?: string;
};

const COLLAPSED_MAX_HEIGHT = "72dvh";
const COLLAPSED_MAX_HEIGHT_RATIO = 0.72;
const EXPANDED_HEIGHT = "92dvh";
const EXPANDED_HEIGHT_RATIO = 0.92;
const SETTLE_DURATION = 180;
const SNAP_DISTANCE = 64;
const FLICK_DISTANCE = 20;
const FLICK_VELOCITY = 0.5;
const SETTLE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

/** BottomSheet 的收起、展开、关闭三态手势；不参与模态层生命周期。 */
export function useBottomSheetMotion(options: UseBottomSheetMotionOptions) {
  const isDragging = ref(false);
  const isExpanded = ref(false);
  const gestureActive = ref(false);
  const dragOffset = ref(0);
  const dragHeight = ref<number | null>(null);
  const dragDelta = ref(0);

  let startY = 0;
  let startHeight = 0;
  let collapsedHeight = 0;
  let lastMoveTime = 0;
  let dragVelocity = 0;
  let previousInputDelta = 0;
  let startedExpanded = false;
  let activePointerId: number | null = null;
  let captureTarget: HTMLElement | null = null;
  let isClosingFromDrag = false;
  let pendingDelta: number | null = null;
  let animationFrame: number | undefined;
  let animationView: Window | null = null;
  let settleTimer: number | undefined;
  let settleView: Window | null = null;
  let settleGeneration = 0;

  function getView(): Window | null {
    return (
      options.motionRef.value?.ownerDocument.defaultView ??
      (typeof window === "undefined" ? null : window)
    );
  }

  function getViewportHeight(): number {
    const view = getView();
    return (
      view?.visualViewport?.height ??
      view?.innerHeight ??
      options.motionRef.value?.ownerDocument.documentElement.clientHeight ??
      0
    );
  }

  function measureCollapsedHeight(): number {
    const motion = options.motionRef.value;
    if (!motion) return collapsedHeight || startHeight;

    const content = motion.querySelector<HTMLElement>("[data-ohmyui-bottom-sheet-content]");
    if (!content) {
      return Math.min(motion.scrollHeight, getViewportHeight() * COLLAPSED_MAX_HEIGHT_RATIO);
    }

    // expanded 时外壳高度固定；用滚动内容的自然高度 + 非内容 chrome 重建收起高度。
    const chromeHeight = Math.max(0, motion.offsetHeight - content.clientHeight);
    const naturalHeight = chromeHeight + content.scrollHeight;
    return Math.min(naturalHeight, getViewportHeight() * COLLAPSED_MAX_HEIGHT_RATIO);
  }

  function now(): number {
    return getView()?.performance.now() ?? Date.now();
  }

  function prefersReducedMotion(): boolean {
    return getView()?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false;
  }

  function clearSettleTimer(): void {
    settleGeneration += 1;
    if (settleTimer === undefined) return;
    if (settleView) settleView.clearTimeout(settleTimer);
    else globalThis.clearTimeout(settleTimer);
    settleTimer = undefined;
    settleView = null;
  }

  function finishSettle(callback?: () => void, preserveMotion = false): void {
    clearSettleTimer();
    const generation = settleGeneration;
    const complete = () => {
      if (generation !== settleGeneration) return;
      settleTimer = undefined;
      settleView = null;
      callback?.();
      if (!preserveMotion) gestureActive.value = false;
    };

    if (prefersReducedMotion()) {
      queueMicrotask(complete);
      return;
    }

    settleView = getView();
    settleTimer = settleView
      ? settleView.setTimeout(complete, SETTLE_DURATION)
      : globalThis.setTimeout(complete, SETTLE_DURATION);
  }

  function cancelAnimationFrame(): void {
    if (animationFrame !== undefined && animationView) {
      animationView.cancelAnimationFrame(animationFrame);
    }
    animationFrame = undefined;
    animationView = null;
    pendingDelta = null;
  }

  function applyDelta(nextDelta: number): void {
    dragDelta.value = nextDelta;
    const expandedHeight = getViewportHeight() * EXPANDED_HEIGHT_RATIO;

    if (startedExpanded) {
      dragOffset.value = 0;
      dragHeight.value = Math.max(
        collapsedHeight,
        Math.min(expandedHeight, startHeight - nextDelta),
      );
    } else if (nextDelta < 0) {
      dragOffset.value = 0;
      dragHeight.value = Math.min(expandedHeight, startHeight - nextDelta);
    } else {
      dragHeight.value = null;
      dragOffset.value = nextDelta;
    }
  }

  function scheduleDelta(nextDelta: number): void {
    pendingDelta = nextDelta;
    if (animationFrame !== undefined) return;

    animationView = getView();
    if (!animationView) {
      const delta = pendingDelta;
      pendingDelta = null;
      if (delta !== null) applyDelta(delta);
      return;
    }

    animationFrame = animationView.requestAnimationFrame(() => {
      animationFrame = undefined;
      animationView = null;
      const delta = pendingDelta;
      pendingDelta = null;
      if (delta !== null) applyDelta(delta);
    });
  }

  function flushPendingDelta(): void {
    const delta = pendingDelta;
    if (animationFrame !== undefined && animationView) {
      animationView.cancelAnimationFrame(animationFrame);
    }
    animationFrame = undefined;
    animationView = null;
    pendingDelta = null;
    if (delta !== null) applyDelta(delta);
  }

  function setExpanded(expanded: boolean): void {
    if (isExpanded.value === expanded) return;
    isExpanded.value = expanded;
    options.onExpandedChange(expanded);
  }

  function releaseActivePointer(): void {
    const pointerId = activePointerId;
    const target = captureTarget;
    activePointerId = null;
    captureTarget = null;
    if (pointerId === null || !target) return;

    try {
      if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    } catch {
      // 节点可能已在外部关闭流程中卸载。
    }
  }

  function settleCollapsed(): void {
    collapsedHeight = measureCollapsedHeight() || collapsedHeight || startHeight;
    isDragging.value = false;
    dragOffset.value = 0;
    dragHeight.value = collapsedHeight || null;
    setExpanded(false);
    finishSettle(() => {
      dragHeight.value = null;
    });
  }

  function settleExpanded(): void {
    isDragging.value = false;
    dragOffset.value = 0;
    dragHeight.value = null;
    setExpanded(true);
    finishSettle();
  }

  function closeFromDrag(): void {
    isDragging.value = false;
    isClosingFromDrag = true;
    dragOffset.value = options.motionRef.value?.offsetHeight ?? getViewportHeight();
    finishSettle(() => {
      options.onDismiss();
      void nextTick(() => {
        // 受控父组件拒绝关闭时，将面板安全弹回收起态。
        if (!options.open()) return;
        isClosingFromDrag = false;
        settleCollapsed();
      });
    }, true);
  }

  function cancelGestureForLeave(): void {
    clearSettleTimer();
    cancelAnimationFrame();
    releaseActivePointer();
    isDragging.value = false;
    gestureActive.value = false;
    dragOffset.value = 0;
    dragHeight.value = null;
    dragDelta.value = 0;
  }

  function reset(notify = true): void {
    const wasExpanded = isExpanded.value;
    cancelGestureForLeave();
    isClosingFromDrag = false;
    isExpanded.value = false;
    collapsedHeight = 0;
    startHeight = 0;
    if (notify && wasExpanded) options.onExpandedChange(false);
  }

  function onPointerDown(event: PointerEvent): void {
    if (
      !options.open() ||
      !options.enabled() ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0) ||
      isClosingFromDrag
    ) {
      return;
    }

    const motion = options.motionRef.value;
    const handle = event.currentTarget as HTMLElement | null;
    if (!motion || !handle) return;

    clearSettleTimer();
    cancelAnimationFrame();
    activePointerId = event.pointerId;
    captureTarget = handle;
    startY = event.clientY;
    startHeight = motion.offsetHeight;
    startedExpanded = isExpanded.value;
    collapsedHeight = startedExpanded ? measureCollapsedHeight() : startHeight;

    lastMoveTime = now();
    dragVelocity = 0;
    previousInputDelta = 0;
    dragOffset.value = 0;
    dragHeight.value = null;
    dragDelta.value = 0;
    gestureActive.value = true;
    isDragging.value = true;

    try {
      handle.setPointerCapture(event.pointerId);
    } catch {
      activePointerId = null;
      captureTarget = null;
      isDragging.value = false;
      gestureActive.value = false;
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (!isDragging.value || event.pointerId !== activePointerId) return;

    if (event.cancelable) event.preventDefault();
    const currentTime = now();
    const nextDelta = event.clientY - startY;
    const elapsed = Math.max(currentTime - lastMoveTime, 1);
    const instantaneousVelocity = (nextDelta - previousInputDelta) / elapsed;

    dragVelocity = dragVelocity * 0.6 + instantaneousVelocity * 0.4;
    previousInputDelta = nextDelta;
    lastMoveTime = currentTime;
    scheduleDelta(nextDelta);
  }

  function onPointerEnd(event: PointerEvent, cancelled = false): void {
    if (!isDragging.value || event.pointerId !== activePointerId) return;

    flushPendingDelta();
    const velocity = now() - lastMoveTime <= 80 ? dragVelocity : 0;
    const sheetHeight = options.motionRef.value?.offsetHeight ?? getViewportHeight();
    const closeDistance = Math.min(120, sheetHeight * 0.25);
    const endedExpanded = startedExpanded;
    releaseActivePointer();

    if (cancelled) {
      if (endedExpanded) settleExpanded();
      else settleCollapsed();
      return;
    }

    if (endedExpanded) {
      const shouldCollapse =
        dragDelta.value >= SNAP_DISTANCE ||
        (dragDelta.value >= FLICK_DISTANCE && velocity >= FLICK_VELOCITY);
      if (shouldCollapse) settleCollapsed();
      else settleExpanded();
      return;
    }

    if (dragDelta.value < 0) {
      const upwardDistance = Math.abs(dragDelta.value);
      const shouldExpand =
        upwardDistance >= SNAP_DISTANCE ||
        (upwardDistance >= FLICK_DISTANCE && velocity <= -FLICK_VELOCITY);
      if (shouldExpand) settleExpanded();
      else settleCollapsed();
      return;
    }

    const shouldClose =
      dragOffset.value >= closeDistance ||
      (dragOffset.value >= FLICK_DISTANCE && velocity >= FLICK_VELOCITY);
    if (shouldClose) closeFromDrag();
    else settleCollapsed();
  }

  function onLostPointerCapture(event: PointerEvent): void {
    if (event.pointerId === activePointerId && isDragging.value) {
      onPointerEnd(event, true);
    }
  }

  const motionStyle = computed<BottomSheetMotionStyle>(() => {
    const style: BottomSheetMotionStyle = {
      maxHeight: isExpanded.value || gestureActive.value ? EXPANDED_HEIGHT : COLLAPSED_MAX_HEIGHT,
    };

    if (!gestureActive.value && isExpanded.value) style.height = EXPANDED_HEIGHT;
    if (!gestureActive.value) return style;

    const motionHeight =
      dragHeight.value ??
      (isExpanded.value
        ? EXPANDED_HEIGHT
        : `${startHeight || options.motionRef.value?.offsetHeight || 0}px`);
    style["--ohmyui-bottom-sheet-height"] =
      typeof motionHeight === "number" ? `${motionHeight}px` : motionHeight;
    style["--ohmyui-bottom-sheet-y"] = `${dragOffset.value}px`;
    style.height = "var(--ohmyui-bottom-sheet-height)";
    style.transform = "translate3d(0, var(--ohmyui-bottom-sheet-y), 0)";
    style.transition =
      isDragging.value || prefersReducedMotion()
        ? "none"
        : `height ${SETTLE_DURATION}ms ${SETTLE_EASING}, transform ${SETTLE_DURATION}ms ${SETTLE_EASING}`;
    style.willChange = "height, transform";
    return style;
  });

  watch(options.open, (open, previousOpen) => {
    if (open) {
      if (previousOpen === false) reset();
      return;
    }
    if (!isClosingFromDrag) cancelGestureForLeave();
  });

  watch(
    options.enabled,
    (enabled) => {
      if (enabled || !gestureActive.value) return;
      cancelAnimationFrame();
      releaseActivePointer();
      if (startedExpanded) settleExpanded();
      else settleCollapsed();
    },
    { flush: "sync" },
  );

  onBeforeUnmount(() => reset(false));

  return {
    gestureActive,
    isDragging,
    isExpanded,
    motionStyle,
    onLostPointerCapture,
    onPointerDown,
    onPointerEnd,
    onPointerMove,
    resetAfterLeave: reset,
  };
}
