import { onBeforeUnmount, watch } from "vue";
import type { Ref } from "vue";

import { observeReducedMotion } from "./reduced-motion";

const LAYOUT_EASING = "cubic-bezier(0.2, 0, 0, 1)";
const EXIT_EASING = "cubic-bezier(0.4, 0, 1, 1)";
const LAYOUT_THRESHOLD = 0.5;
const PANEL_SELECTOR = "[data-ohmyui-dialog-panel]";
const EXIT_CLONE_ATTRIBUTE = "data-ohmyui-modal-motion-clone";
const UNSAFE_CLONE_SELECTOR = [
  "iframe",
  "object",
  "embed",
  "audio",
  "video",
  "canvas",
  "[is]",
  "form",
  "button",
  "datalist",
  "fieldset",
  "input",
  "keygen",
  "meter",
  "optgroup",
  "option",
  "output",
  "progress",
  "select",
  "textarea",
  "[form]",
].join(", ");

type MotionElement = HTMLElement | SVGElement;

interface LayoutSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
  hasTransform: boolean;
}

interface RunningMotion {
  animation: Animation;
  offsetX: number;
  offsetY: number;
  fromOpacity?: number;
  toOpacity?: number;
}

interface InterruptedMotion {
  offsetX: number;
  offsetY: number;
  opacity?: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function getAnimationProgress(animation: Animation): number {
  const progress = animation.effect?.getComputedTiming().progress;
  if (typeof progress === "number") return clamp(progress, 0, 1);
  return animation.playState === "finished" ? 1 : 0;
}

function getDuration(offsetX: number, offsetY: number): number {
  const distance = Math.hypot(offsetX, offsetY);
  return Math.round(Math.min(260, Math.max(190, 190 + distance * 0.35)));
}

function parseOpacity(value: string): number {
  const opacity = Number.parseFloat(value);
  return Number.isFinite(opacity) ? opacity : 1;
}

function withOffset(transform: string, offsetX: number, offsetY: number): string {
  const translated = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
  return transform === "none" ? translated : `${translated} ${transform}`;
}

function isMotionElement(element: Element): element is MotionElement {
  return (
    element.namespaceURI === "http://www.w3.org/1999/xhtml" ||
    element.namespaceURI === "http://www.w3.org/2000/svg"
  );
}

function isMotionClone(element: Element): boolean {
  return element.hasAttribute(EXIT_CLONE_ATTRIBUTE);
}

function getDirectElements(body: HTMLElement): MotionElement[] {
  return Array.from(body.children).filter(
    (element): element is MotionElement => isMotionElement(element) && !isMotionClone(element),
  );
}

function getMutationElements(nodes: NodeList): MotionElement[] {
  return Array.from(nodes).filter((node): node is MotionElement => {
    if (node.nodeType !== 1) return false;
    const element = node as Element;
    return isMotionElement(element) && !isMotionClone(element);
  });
}

function scrubCloneAccessibility(clone: MotionElement): void {
  clone.removeAttribute("id");
  clone.removeAttribute("autofocus");
  for (const descendant of clone.querySelectorAll("[id], [autofocus]")) {
    descendant.removeAttribute("id");
    descendant.removeAttribute("autofocus");
  }
}

function containsCustomElement(root: Element): boolean {
  if (root.localName.includes("-")) return true;
  return Array.from(root.querySelectorAll("*")).some((element) => element.localName.includes("-"));
}

function canCloneWithoutSideEffects(element: MotionElement): boolean {
  return (
    !element.matches(UNSAFE_CLONE_SELECTOR) &&
    !element.querySelector(UNSAFE_CLONE_SELECTOR) &&
    !containsCustomElement(element)
  );
}

function hasVisualTransform(style: CSSStyleDeclaration): boolean {
  return [
    style.transform,
    style.getPropertyValue("translate"),
    style.getPropertyValue("rotate"),
    style.getPropertyValue("scale"),
  ].some((value) => value !== "" && value !== "none");
}

function snapshotsDiffer(previous: LayoutSnapshot, current: LayoutSnapshot): boolean {
  return (
    Math.abs(previous.x - current.x) >= LAYOUT_THRESHOLD ||
    Math.abs(previous.y - current.y) >= LAYOUT_THRESHOLD ||
    Math.abs(previous.width - current.width) >= LAYOUT_THRESHOLD ||
    Math.abs(previous.height - current.height) >= LAYOUT_THRESHOLD
  );
}

function layoutsDiffer(
  previous: Map<MotionElement, LayoutSnapshot>,
  current: Map<MotionElement, LayoutSnapshot>,
): boolean {
  if (previous.size !== current.size) return true;
  for (const [element, snapshot] of current) {
    const previousSnapshot = previous.get(element);
    if (!previousSnapshot || snapshotsDiffer(previousSnapshot, snapshot)) return true;
  }
  return false;
}

export function useModalBodyMotion(bodyRef: Ref<HTMLElement | null>) {
  let body: HTMLElement | null = null;
  let mutationObserver: MutationObserver | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let disposeReducedMotion: (() => void) | undefined;
  let enabled = false;
  let trackingRequested = false;
  let prefersReducedMotion = false;
  let layoutDirty = false;
  let layouts = new Map<MotionElement, LayoutSnapshot>();

  const runningMotions = new Map<MotionElement, RunningMotion>();
  const exitClones = new Map<MotionElement, Animation>();

  function measureElements(
    container: HTMLElement,
    visualOffsets?: Map<MotionElement, InterruptedMotion>,
  ): Map<MotionElement, LayoutSnapshot> {
    const bodyRect = container.getBoundingClientRect();
    const view = container.ownerDocument.defaultView;
    const nextLayouts = new Map<MotionElement, LayoutSnapshot>();

    for (const element of getDirectElements(container)) {
      const rect = element.getBoundingClientRect();
      const computedStyle = view?.getComputedStyle(element);
      const visualOffset = visualOffsets?.get(element);
      nextLayouts.set(element, {
        x: rect.left - bodyRect.left + container.scrollLeft - (visualOffset?.offsetX ?? 0),
        y: rect.top - bodyRect.top + container.scrollTop - (visualOffset?.offsetY ?? 0),
        width: rect.width,
        height: rect.height,
        hasTransform: computedStyle ? hasVisualTransform(computedStyle) : false,
      });
    }

    return nextLayouts;
  }

  function captureLayout(): void {
    if (!body?.isConnected || runningMotions.size > 0) return;
    layouts = measureElements(body);
    layoutDirty = false;
  }

  function readInterruptedMotion(motion: RunningMotion): InterruptedMotion {
    const progress = getAnimationProgress(motion.animation);
    const remaining = 1 - progress;
    const opacity =
      motion.fromOpacity === undefined || motion.toOpacity === undefined
        ? undefined
        : motion.fromOpacity + (motion.toOpacity - motion.fromOpacity) * progress;

    return {
      offsetX: motion.offsetX * remaining,
      offsetY: motion.offsetY * remaining,
      opacity,
    };
  }

  function readInterruptedMotions(): Map<MotionElement, InterruptedMotion> {
    const interrupted = new Map<MotionElement, InterruptedMotion>();
    for (const [element, motion] of runningMotions) {
      interrupted.set(element, readInterruptedMotion(motion));
    }
    return interrupted;
  }

  function cancelRunningMotions(): void {
    for (const motion of runningMotions.values()) {
      try {
        motion.animation.cancel();
      } catch {
        // Layout motion is progressive enhancement.
      }
    }
    runningMotions.clear();
  }

  function removeExitClones(): void {
    for (const [clone, animation] of exitClones) {
      try {
        animation.cancel();
      } catch {
        // The clone is removed below regardless of animation support.
      }
      clone.remove();
    }
    exitClones.clear();
  }

  function animateElement(
    element: MotionElement,
    offsetX: number,
    offsetY: number,
    fromOpacity?: number,
  ): void {
    const view = element.ownerDocument.defaultView;
    if (!view || prefersReducedMotion || typeof element.animate !== "function") return;

    const computedStyle = view.getComputedStyle(element);
    const targetTransform = computedStyle.transform;
    const targetOpacity = parseOpacity(computedStyle.opacity);
    const opacityChanges =
      fromOpacity !== undefined && Math.abs(fromOpacity - targetOpacity) >= 0.01;
    if (Math.hypot(offsetX, offsetY) < LAYOUT_THRESHOLD && !opacityChanges) return;

    const startFrame: Keyframe = {
      transform: withOffset(targetTransform, offsetX, offsetY),
    };
    const endFrame: Keyframe = { transform: targetTransform };
    if (fromOpacity !== undefined) {
      startFrame.opacity = fromOpacity;
      endFrame.opacity = targetOpacity;
    }

    let animation: Animation;
    try {
      animation = element.animate([startFrame, endFrame], {
        duration: getDuration(offsetX, offsetY),
        easing: LAYOUT_EASING,
        fill: "both",
      });
    } catch {
      return;
    }
    const motion: RunningMotion = {
      animation,
      offsetX,
      offsetY,
      fromOpacity,
      toOpacity: fromOpacity === undefined ? undefined : targetOpacity,
    };
    runningMotions.set(element, motion);

    animation.addEventListener(
      "finish",
      () => {
        if (runningMotions.get(element) !== motion) return;
        runningMotions.delete(element);
        try {
          animation.cancel();
        } catch {
          // The completed animation no longer owns layout state.
        }
        if (runningMotions.size === 0) captureLayout();
      },
      { once: true },
    );
  }

  function animateExitClone(
    removedElement: MotionElement,
    snapshot: LayoutSnapshot,
    interrupted: InterruptedMotion | undefined,
  ): void {
    const container = body;
    const panel = container?.closest<HTMLElement>(PANEL_SELECTOR);
    const view = panel?.ownerDocument.defaultView;
    const panelStyle = panel && view ? view.getComputedStyle(panel) : undefined;
    if (
      !container ||
      !panel ||
      !panelStyle ||
      !["relative", "absolute", "fixed", "sticky"].includes(panelStyle.position) ||
      prefersReducedMotion ||
      snapshot.width <= 0 ||
      snapshot.height <= 0 ||
      snapshot.hasTransform ||
      hasVisualTransform(panelStyle) ||
      typeof removedElement.animate !== "function" ||
      !canCloneWithoutSideEffects(removedElement)
    ) {
      return;
    }

    const clone = removedElement.cloneNode(true) as MotionElement;
    if (typeof clone.animate !== "function") return;

    scrubCloneAccessibility(clone);
    clone.setAttribute(EXIT_CLONE_ATTRIBUTE, "");
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("inert", "");

    const panelRect = panel.getBoundingClientRect();
    const bodyRect = container.getBoundingClientRect();
    const panelPaddingLeft = panelRect.left + panel.clientLeft;
    const panelPaddingTop = panelRect.top + panel.clientTop;
    const offsetX = interrupted?.offsetX ?? 0;
    const offsetY = interrupted?.offsetY ?? 0;
    Object.assign(clone.style, {
      position: "absolute",
      left: `${bodyRect.left + snapshot.x - container.scrollLeft + offsetX - panelPaddingLeft + panel.scrollLeft}px`,
      top: `${bodyRect.top + snapshot.y - container.scrollTop + offsetY - panelPaddingTop + panel.scrollTop}px`,
      width: `${snapshot.width}px`,
      height: `${snapshot.height}px`,
      boxSizing: "border-box",
      margin: "0",
      pointerEvents: "none",
      transformOrigin: "center",
      zIndex: "1",
    });
    panel.append(clone);

    const computedStyle = view?.getComputedStyle(clone);
    const startOpacity = interrupted?.opacity ?? parseOpacity(computedStyle?.opacity ?? "1");
    let animation: Animation;
    try {
      animation = clone.animate(
        [
          { opacity: startOpacity, translate: "0 0" },
          { opacity: 0, translate: "0 -4px" },
        ],
        {
          duration: 170,
          easing: EXIT_EASING,
          fill: "both",
        },
      );
    } catch {
      clone.remove();
      return;
    }
    exitClones.set(clone, animation);

    animation.addEventListener(
      "finish",
      () => {
        if (exitClones.get(clone) !== animation) return;
        exitClones.delete(clone);
        try {
          animation.cancel();
        } catch {
          // The clone is removed below regardless of animation support.
        }
        clone.remove();
      },
      { once: true },
    );
  }

  function stopTracking(): void {
    try {
      mutationObserver?.takeRecords();
      mutationObserver?.disconnect();
    } catch {
      // Observer cleanup must not block the running visual motion.
    }
    try {
      resizeObserver?.disconnect();
    } catch {
      // Observer cleanup must not block the running visual motion.
    }
  }

  function syncResizeTargets(): void {
    const observer = resizeObserver;
    const container = body;
    if (!trackingRequested || !observer || !container) return;

    try {
      observer.disconnect();
      observer.observe(container);
      for (const element of getDirectElements(container)) observer.observe(element);
    } catch {
      observer.disconnect();
      if (resizeObserver === observer) resizeObserver = undefined;
    }
  }

  function startTracking(): void {
    const container = body;
    if (!trackingRequested || !container) return;

    const observer = mutationObserver;
    if (observer) {
      try {
        observer.observe(container, { childList: true });
      } catch {
        try {
          observer.disconnect();
        } catch {
          // Mutation tracking is progressive enhancement.
        }
        if (mutationObserver === observer) mutationObserver = undefined;
      }
    }
    syncResizeTargets();
  }

  function handleLayoutResize(): void {
    const container = body;
    if (!trackingRequested || !container) return;

    if (prefersReducedMotion || !enabled) {
      if (runningMotions.size === 0) captureLayout();
      else layoutDirty = true;
      return;
    }

    const interruptedMotions = readInterruptedMotions();
    const nextLayouts = measureElements(container, interruptedMotions);
    if (!layoutsDiffer(layouts, nextLayouts)) {
      layouts = nextLayouts;
      layoutDirty = false;
      return;
    }

    const previousLayouts = layouts;
    cancelRunningMotions();

    for (const [element, current] of nextLayouts) {
      const previous = previousLayouts.get(element);
      if (!previous) continue;

      const interrupted = interruptedMotions.get(element);
      const offsetX = previous.x + (interrupted?.offsetX ?? 0) - current.x;
      const offsetY = previous.y + (interrupted?.offsetY ?? 0) - current.y;
      animateElement(element, offsetX, offsetY, interrupted?.opacity);
    }
    layouts = nextLayouts;
    layoutDirty = false;
  }

  function handleMutations(records: MutationRecord[]): void {
    const container = body;
    if (!trackingRequested || !container) return;

    const addedElements = new Set<MotionElement>();
    const removedElements = new Set<MotionElement>();
    for (const record of records) {
      for (const element of getMutationElements(record.addedNodes)) addedElements.add(element);
      for (const element of getMutationElements(record.removedNodes)) removedElements.add(element);
    }
    if (addedElements.size === 0 && removedElements.size === 0) return;

    if (prefersReducedMotion || !enabled) {
      if (runningMotions.size === 0) captureLayout();
      else layoutDirty = true;
      syncResizeTargets();
      return;
    }

    const interruptedMotions = readInterruptedMotions();
    cancelRunningMotions();

    const previousLayouts = layouts;
    const nextLayouts = measureElements(container);

    for (const element of removedElements) {
      if (container.contains(element)) continue;
      const previous = previousLayouts.get(element);
      if (previous) animateExitClone(element, previous, interruptedMotions.get(element));
    }

    for (const [element, current] of nextLayouts) {
      const previous = previousLayouts.get(element);
      if (!previous) {
        animateElement(element, 0, 6, 0);
        continue;
      }

      const interrupted = interruptedMotions.get(element);
      const offsetX = previous.x + (interrupted?.offsetX ?? 0) - current.x;
      const offsetY = previous.y + (interrupted?.offsetY ?? 0) - current.y;
      animateElement(element, offsetX, offsetY, interrupted?.opacity);
    }

    layouts = nextLayouts;
    layoutDirty = false;
    syncResizeTargets();
  }

  function handleMotionPreferenceChange(matches: boolean): void {
    prefersReducedMotion = matches;
    if (matches) {
      cancelRunningMotions();
      removeExitClones();
      layoutDirty = false;
    }
    captureLayout();
  }

  function detachBody(): void {
    stopTracking();

    mutationObserver = undefined;
    resizeObserver = undefined;

    const dispose = disposeReducedMotion;
    disposeReducedMotion = undefined;
    try {
      dispose?.();
    } catch {
      // Reduced-motion tracking is progressive enhancement.
    }

    cancelRunningMotions();
    removeExitClones();
    layouts.clear();
    layoutDirty = false;
    body = null;
  }

  function attachBody(nextBody: HTMLElement): void {
    detachBody();
    body = nextBody;

    const view = nextBody.ownerDocument.defaultView;
    const MutationObserverConstructor = view?.MutationObserver;
    if (MutationObserverConstructor) {
      try {
        mutationObserver = new MutationObserverConstructor(handleMutations);
      } catch {
        mutationObserver = undefined;
      }
    }

    const ResizeObserverConstructor = view?.ResizeObserver;
    if (ResizeObserverConstructor) {
      try {
        // Transform-only FLIP writes do not affect observed layout sizes, so retarget in the
        // current ResizeObserver delivery before the browser paints the final positions.
        resizeObserver = new ResizeObserverConstructor(handleLayoutResize);
      } catch {
        resizeObserver = undefined;
      }
    }

    const reducedMotion = observeReducedMotion(
      nextBody.ownerDocument,
      handleMotionPreferenceChange,
    );
    disposeReducedMotion = reducedMotion.dispose;
    prefersReducedMotion = reducedMotion.matches;
    layouts = measureElements(nextBody);
    layoutDirty = false;
    startTracking();
  }

  function prepareForOpen(): void {
    enabled = false;
    trackingRequested = true;
    if (runningMotions.size === 0) captureLayout();
    else layoutDirty = true;
    startTracking();
  }

  function enable(): void {
    enabled = true;
    trackingRequested = true;
    startTracking();

    if (runningMotions.size === 0) {
      captureLayout();
    } else if (layoutDirty) {
      handleLayoutResize();
    }
  }

  function suspend(): void {
    enabled = false;
    trackingRequested = false;
    stopTracking();
  }

  function disable(): void {
    suspend();
    cancelRunningMotions();
    removeExitClones();
    layoutDirty = false;
    captureLayout();
  }

  watch(
    bodyRef,
    (nextBody) => {
      if (nextBody) attachBody(nextBody);
      else detachBody();
    },
    { flush: "post" },
  );

  onBeforeUnmount(detachBody);

  return {
    prepareForOpen,
    enable,
    suspend,
    disable,
  };
}
