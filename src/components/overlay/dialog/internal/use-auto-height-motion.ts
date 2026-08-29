import type { Ref } from "vue";

import { observeReducedMotion } from "./reduced-motion";

const HEIGHT_EASING = "cubic-bezier(0.2, 0, 0, 1)";
const HEIGHT_THRESHOLD = 0.5;

interface RunningHeightMotion {
  animation: Animation;
  panel: HTMLElement;
}

function toPixels(value: number): string {
  return `${Math.round(Math.max(0, value) * 100) / 100}px`;
}

function readPixelValue(value: string): number {
  return Number.parseFloat(value) || 0;
}

function getBlockEdges(style: CSSStyleDeclaration): number {
  return (
    readPixelValue(style.paddingTop) +
    readPixelValue(style.paddingBottom) +
    readPixelValue(style.borderTopWidth) +
    readPixelValue(style.borderBottomWidth)
  );
}

function getDuration(distance: number): number {
  return Math.round(Math.min(260, Math.max(180, 180 + distance * 0.4)));
}

export function useAutoHeightMotion(
  panelRef: Ref<HTMLElement | null>,
  contentRef: Ref<HTMLElement | null>,
) {
  let resizeObserver: ResizeObserver | undefined;
  let panelMutationObserver: MutationObserver | undefined;
  let disposeReducedMotion: (() => void) | undefined;
  let runningMotion: RunningHeightMotion | undefined;
  let trackedPanel: HTMLElement | null = null;
  let trackedContent: HTMLElement | null = null;
  let trackingGeneration = 0;
  let motionEnabled = false;
  let prefersReducedMotion = false;
  let retargetPending = false;
  let lastPanelHeight: number | undefined;
  let lastContentWidth: number | undefined;
  let lastContentHeight: number | undefined;
  let lastPanelClass: string | null = null;
  let lastPanelStyle: string | null = null;

  function measureUsedBorderBoxHeight(panel: HTMLElement): number {
    const view = panel.ownerDocument.defaultView;
    const panelStyle = view?.getComputedStyle(panel);
    if (!panelStyle) return panel.offsetHeight;

    const usedHeight = Number.parseFloat(panelStyle.height);
    if (!Number.isFinite(usedHeight)) return panel.offsetHeight;

    return Math.max(
      0,
      usedHeight + (panelStyle.boxSizing === "border-box" ? 0 : getBlockEdges(panelStyle)),
    );
  }

  function borderBoxToCssHeight(panel: HTMLElement, borderBoxHeight: number): number {
    const view = panel.ownerDocument.defaultView;
    const panelStyle = view?.getComputedStyle(panel);
    if (!panelStyle || panelStyle.boxSizing === "border-box") {
      return Math.max(0, borderBoxHeight);
    }

    return Math.max(0, borderBoxHeight - getBlockEdges(panelStyle));
  }

  function cancelHeightAnimation(captureVisualHeight: boolean): number | undefined {
    const motion = runningMotion;
    const visualHeight =
      captureVisualHeight && motion?.panel.isConnected
        ? measureUsedBorderBoxHeight(motion.panel)
        : undefined;

    runningMotion = undefined;
    if (motion) {
      try {
        motion.animation.cancel();
      } catch {
        // Height motion is optional; the underlying panel layout remains authoritative.
      }
    }
    return visualHeight;
  }

  function finishHeightAnimation(motion: RunningHeightMotion): void {
    if (runningMotion !== motion) return;

    runningMotion = undefined;
    try {
      motion.animation.cancel();
    } catch {
      // A completed effect must not remain responsible for panel layout.
    }
  }

  function startHeightAnimation(
    panel: HTMLElement,
    visualHeight: number,
    targetHeight: number,
  ): void {
    const distance = Math.abs(targetHeight - visualHeight);
    if (
      prefersReducedMotion ||
      distance < HEIGHT_THRESHOLD ||
      typeof panel.animate !== "function"
    ) {
      return;
    }

    const fromHeight = borderBoxToCssHeight(panel, visualHeight);
    const toHeight = borderBoxToCssHeight(panel, targetHeight);

    let animation: Animation;
    try {
      animation = panel.animate(
        [{ height: toPixels(fromHeight) }, { height: toPixels(toHeight) }],
        {
          duration: getDuration(distance),
          easing: HEIGHT_EASING,
          fill: "both",
        },
      );
    } catch {
      return;
    }

    const motion: RunningHeightMotion = { animation, panel };
    runningMotion = motion;
    try {
      animation.addEventListener("finish", () => finishHeightAnimation(motion), { once: true });
      animation.addEventListener("cancel", () => finishHeightAnimation(motion), { once: true });
    } catch {
      cancelHeightAnimation(false);
    }
  }

  function retargetHeight(animate: boolean): void {
    const panel = panelRef.value;
    const content = contentRef.value;
    if (!panel || !content || !panel.isConnected || !content.isConnected) {
      cancelHeightAnimation(false);
      lastPanelHeight = undefined;
      retargetPending = false;
      return;
    }

    if (!animate || prefersReducedMotion) {
      if (runningMotion) {
        retargetPending = true;
        return;
      }
      lastPanelHeight = panel.offsetHeight;
      retargetPending = false;
      return;
    }

    // Capture the rendered frame before releasing the old effect. offsetHeight is read only
    // afterwards, so it reflects the caller's CSS or natural layout rather than the WAAPI value.
    const interruptedHeight = runningMotion ? cancelHeightAnimation(true) : undefined;
    const previousTargetHeight = lastPanelHeight;
    const targetHeight = panel.offsetHeight;
    lastPanelHeight = targetHeight;
    retargetPending = false;

    startHeightAnimation(
      panel,
      interruptedHeight ?? previousTargetHeight ?? targetHeight,
      targetHeight,
    );
  }

  function disconnectTracking(): void {
    const observer = resizeObserver;
    resizeObserver = undefined;
    try {
      observer?.disconnect();
    } catch {
      // Observer cleanup must not block dialog teardown.
    }

    const mutationObserver = panelMutationObserver;
    panelMutationObserver = undefined;
    try {
      mutationObserver?.disconnect();
    } catch {
      // Attribute tracking is progressive enhancement.
    }

    const dispose = disposeReducedMotion;
    disposeReducedMotion = undefined;
    try {
      dispose?.();
    } catch {
      // Reduced-motion tracking is progressive enhancement.
    }
  }

  function updateContentSize(content: HTMLElement): boolean {
    const width = content.offsetWidth;
    const height = content.offsetHeight;
    const changed =
      lastContentWidth === undefined ||
      lastContentHeight === undefined ||
      Math.abs(lastContentWidth - width) >= HEIGHT_THRESHOLD ||
      Math.abs(lastContentHeight - height) >= HEIGHT_THRESHOLD;

    lastContentWidth = width;
    lastContentHeight = height;
    return changed;
  }

  function updatePanelAttributes(panel: HTMLElement): boolean {
    const panelClass = panel.getAttribute("class");
    const panelStyle = panel.getAttribute("style");
    const changed = panelClass !== lastPanelClass || panelStyle !== lastPanelStyle;
    lastPanelClass = panelClass;
    lastPanelStyle = panelStyle;
    return changed;
  }

  function handleMotionPreferenceChange(matches: boolean): void {
    prefersReducedMotion = matches;
    if (matches) {
      cancelHeightAnimation(false);
      retargetPending = false;
    }

    const panel = panelRef.value;
    if (!runningMotion) {
      lastPanelHeight = panel?.isConnected ? panel.offsetHeight : undefined;
    }
  }

  function prepare(): void {
    trackingGeneration += 1;
    motionEnabled = false;
    disconnectTracking();

    const panel = panelRef.value;
    const motion = runningMotion;
    const canPreserveMotion =
      Boolean(motion?.panel.isConnected) && (!panel || motion?.panel === panel);
    if (motion && !canPreserveMotion) {
      cancelHeightAnimation(false);
      lastPanelHeight = undefined;
      retargetPending = false;
    }
  }

  function start(): void {
    trackingGeneration += 1;
    disconnectTracking();

    const panel = panelRef.value;
    const content = contentRef.value;
    if (!panel || !content) return;

    const preservingMotion = runningMotion?.panel === panel && panel.isConnected;
    if (runningMotion && !preservingMotion) {
      cancelHeightAnimation(false);
      lastPanelHeight = undefined;
      retargetPending = false;
    }

    const samePanel = trackedPanel === panel;
    const sameContent = trackedContent === content;
    const contentChanged = sameContent ? updateContentSize(content) : false;
    const panelAttributesChanged = samePanel ? updatePanelAttributes(panel) : false;

    trackedPanel = panel;
    trackedContent = content;
    if (!sameContent) {
      lastContentWidth = content.offsetWidth;
      lastContentHeight = content.offsetHeight;
    }
    if (!samePanel) {
      lastPanelClass = panel.getAttribute("class");
      lastPanelStyle = panel.getAttribute("style");
    }

    if (preservingMotion) {
      retargetPending ||= contentChanged || panelAttributesChanged || !sameContent;
    } else {
      lastPanelHeight = panel.offsetHeight;
      retargetPending = false;
    }

    const view = panel.ownerDocument.defaultView;
    if (!view || typeof panel.animate !== "function") return;

    const reducedMotion = observeReducedMotion(panel.ownerDocument, handleMotionPreferenceChange);
    disposeReducedMotion = reducedMotion.dispose;
    prefersReducedMotion = reducedMotion.matches;
    if (prefersReducedMotion) {
      cancelHeightAnimation(false);
      lastPanelHeight = panel.isConnected ? panel.offsetHeight : undefined;
      retargetPending = false;
    }

    const generation = trackingGeneration;
    const ResizeObserverConstructor = view.ResizeObserver;
    if (ResizeObserverConstructor) {
      try {
        resizeObserver = new ResizeObserverConstructor(() => {
          if (generation !== trackingGeneration || !updateContentSize(content)) return;
          retargetHeight(motionEnabled);
        });
        try {
          resizeObserver.observe(content, { box: "border-box" });
        } catch {
          resizeObserver.observe(content);
        }
      } catch {
        try {
          resizeObserver?.disconnect();
        } catch {
          // Resize tracking is progressive enhancement.
        }
        resizeObserver = undefined;
      }
    }

    const MutationObserverConstructor = view.MutationObserver;
    if (!MutationObserverConstructor) return;
    try {
      panelMutationObserver = new MutationObserverConstructor(() => {
        if (generation !== trackingGeneration || !updatePanelAttributes(panel)) return;
        retargetHeight(motionEnabled);
      });
      panelMutationObserver.observe(panel, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    } catch {
      try {
        panelMutationObserver?.disconnect();
      } catch {
        // Attribute tracking is progressive enhancement.
      }
      panelMutationObserver = undefined;
    }
  }

  function enable(): void {
    motionEnabled = true;
    if (prefersReducedMotion) {
      cancelHeightAnimation(false);
      retargetHeight(false);
    } else if (retargetPending && runningMotion) {
      retargetHeight(true);
    } else if (!runningMotion) {
      retargetHeight(false);
    }
  }

  function freeze(): void {
    trackingGeneration += 1;
    motionEnabled = false;
    disconnectTracking();
  }

  function reset(): void {
    trackingGeneration += 1;
    motionEnabled = false;
    disconnectTracking();
    cancelHeightAnimation(false);
    prefersReducedMotion = false;
    retargetPending = false;
    lastPanelHeight = undefined;
    lastContentWidth = undefined;
    lastContentHeight = undefined;
    lastPanelClass = null;
    lastPanelStyle = null;
    trackedPanel = null;
    trackedContent = null;
  }

  return {
    prepare,
    start,
    enable,
    freeze,
    reset,
  };
}
