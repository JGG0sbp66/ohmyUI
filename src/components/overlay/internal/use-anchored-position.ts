import { computed, onBeforeUnmount, ref } from "vue";

import { computeAnchoredPosition } from "./anchored-position";
import type {
  AnchoredFloatingStyle,
  AnchoredPositionSnapshot,
  UseAnchoredPositionOptions,
} from "./anchored-position.types";

export function useAnchoredPosition(options: UseAnchoredPositionOptions) {
  const positioned = ref(false);
  const snapshot = ref<AnchoredPositionSnapshot | null>(null);
  const floatingStyle = computed<AnchoredFloatingStyle>(() => ({
    position: "fixed",
    top: snapshot.value ? `${snapshot.value.y}px` : "0",
    left: snapshot.value ? `${snapshot.value.x}px` : "0",
    visibility: positioned.value ? "visible" : "hidden",
    "--ohmyui-available-width": snapshot.value ? `${snapshot.value.availableWidth}px` : undefined,
    "--ohmyui-available-height": snapshot.value ? `${snapshot.value.availableHeight}px` : undefined,
  }));

  let activeWindow: Window | null = null;
  let activeVisualViewport: VisualViewport | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let animationFrame = 0;
  let generation = 0;

  const updateNow = (): AnchoredPositionSnapshot | null => {
    const reference = options.reference.value;
    const floating = options.floating.value;
    const document = reference?.ownerDocument;
    const window = document?.defaultView;
    if (!reference || !floating || !document || !window || floating.ownerDocument !== document) {
      return null;
    }

    const width = floating.offsetWidth;
    const height = floating.offsetHeight;
    if (width === 0 || height === 0) return null;

    const viewport = window.visualViewport;
    const next = computeAnchoredPosition({
      referenceRect: reference.getBoundingClientRect(),
      floatingWidth: width,
      floatingHeight: height,
      viewport: {
        x: viewport?.offsetLeft ?? 0,
        y: viewport?.offsetTop ?? 0,
        width: viewport?.width ?? window.innerWidth,
        height: viewport?.height ?? window.innerHeight,
      },
      placement: options.placement(),
      offset: Math.max(0, options.offset()),
      collisionPadding: Math.max(0, options.collisionPadding()),
      flip: options.flip(),
      shift: options.shift(),
    });

    snapshot.value = next;
    positioned.value = true;
    return next;
  };

  const scheduleUpdate = () => {
    const window = activeWindow;
    if (!window || animationFrame) return;

    animationFrame = window.requestAnimationFrame(() => {
      animationFrame = 0;
      updateNow();
    });
  };

  const stopTracking = (clearPosition: boolean) => {
    generation += 1;
    if (animationFrame && activeWindow) activeWindow.cancelAnimationFrame(animationFrame);
    animationFrame = 0;

    activeWindow?.removeEventListener("resize", scheduleUpdate);
    activeWindow?.removeEventListener("scroll", scheduleUpdate, true);
    activeVisualViewport?.removeEventListener("resize", scheduleUpdate);
    activeVisualViewport?.removeEventListener("scroll", scheduleUpdate);
    resizeObserver?.disconnect();

    activeWindow = null;
    activeVisualViewport = null;
    resizeObserver = null;
    if (clearPosition) positioned.value = false;
  };

  const stop = () => stopTracking(true);
  // 离场期间保留最后一次坐标和 visibility，只停止昂贵的 DOM 观察。
  const pause = () => stopTracking(false);
  const clear = () => {
    positioned.value = false;
    snapshot.value = null;
  };

  const start = () => {
    stop();
    const currentGeneration = generation;
    const reference = options.reference.value;
    const floating = options.floating.value;
    const document = reference?.ownerDocument;
    const window = document?.defaultView;
    if (!reference || !floating || !document || !window || floating.ownerDocument !== document) {
      return;
    }

    activeWindow = window;
    activeVisualViewport = window.visualViewport;
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    activeVisualViewport?.addEventListener("resize", scheduleUpdate);
    activeVisualViewport?.addEventListener("scroll", scheduleUpdate);

    type ResizeObserverWindow = Window & {
      ResizeObserver?: new (callback: ResizeObserverCallback) => ResizeObserver;
    };
    const ResizeObserverConstructor = (window as ResizeObserverWindow).ResizeObserver;
    if (ResizeObserverConstructor) {
      resizeObserver = new ResizeObserverConstructor(scheduleUpdate);
      resizeObserver.observe(reference);
      resizeObserver.observe(floating);
    }

    positioned.value = false;
    updateNow();
    void document.fonts?.ready.then(() => {
      if (currentGeneration === generation) scheduleUpdate();
    });
  };

  onBeforeUnmount(stop);

  return {
    clear,
    floatingStyle,
    pause,
    positioned,
    snapshot,
    start,
    stop,
    update: updateNow,
  };
}
