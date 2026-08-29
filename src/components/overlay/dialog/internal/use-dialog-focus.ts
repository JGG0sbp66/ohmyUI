import type { Ref } from "vue";

import {
  isElementAvailable,
  isElementInDocument,
  isHtmlElement,
  isNodeInDocument,
  tryFocusElement,
} from "./dialog-dom";

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

interface UseDialogFocusOptions {
  panelRef: Ref<HTMLElement | null>;
  initialFocus: () => string | undefined;
  dialogDomId: string;
}

export function useDialogFocus({ panelRef, initialFocus, dialogDomId }: UseDialogFocusOptions) {
  let returnFocusTarget: HTMLElement | null = null;

  function getTabbableElements(): HTMLElement[] {
    const panel = panelRef.value;
    if (!panel) return [];

    return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (element) => element.tabIndex >= 0 && isElementAvailable(element),
    );
  }

  function focusInitialElement(): void {
    const panel = panelRef.value;
    if (!panel) return;

    let requested: HTMLElement | null = null;
    const selector = initialFocus();
    if (selector) {
      try {
        requested = panel.querySelector<HTMLElement>(selector);
      } catch {
        requested = null;
      }
    }

    const candidates = [
      requested,
      panel.querySelector<HTMLElement>("[autofocus]"),
      getTabbableElements()[0],
      panel,
    ];
    const visited = new Set<HTMLElement>();
    for (const candidate of candidates) {
      if (!candidate || visited.has(candidate)) continue;
      visited.add(candidate);
      if (tryFocusElement(candidate)) return;
    }
  }

  function trapFocus(event: KeyboardEvent): void {
    const panel = panelRef.value;
    if (!panel) return;

    const tabbable = getTabbableElements();
    if (tabbable.length === 0) {
      event.preventDefault();
      tryFocusElement(panel);
      return;
    }

    const document = panel.ownerDocument;
    const active = document.activeElement;
    if (!isNodeInDocument(active, document) || !panel.contains(active) || active === panel) {
      event.preventDefault();
      tryFocusElement(event.shiftKey ? (tabbable.at(-1) ?? null) : (tabbable[0] ?? null));
      return;
    }

    const activeIndex = isHtmlElement(active, document) ? tabbable.indexOf(active) : -1;
    if (activeIndex >= 0) {
      if (event.shiftKey && activeIndex === 0) {
        event.preventDefault();
        tryFocusElement(tabbable.at(-1) ?? null);
      } else if (!event.shiftKey && activeIndex === tabbable.length - 1) {
        event.preventDefault();
        tryFocusElement(tabbable[0] ?? null);
      }
      return;
    }

    const NodeConstructor = document.defaultView?.Node;
    const preceding = NodeConstructor?.DOCUMENT_POSITION_PRECEDING ?? 2;
    const following = NodeConstructor?.DOCUMENT_POSITION_FOLLOWING ?? 4;
    const target = event.shiftKey
      ? (tabbable.filter((element) => active.compareDocumentPosition(element) & preceding).at(-1) ??
        tabbable.at(-1))
      : (tabbable.find((element) => active.compareDocumentPosition(element) & following) ??
        tabbable[0]);

    event.preventDefault();
    tryFocusElement(target ?? null);
  }

  function handleFocusin(event: FocusEvent, document: Document): void {
    const panel = panelRef.value;
    const target = event.target;
    if (!panel || !isNodeInDocument(target, document) || panel.contains(target)) return;

    if (isElementInDocument(target, document)) {
      const allowedPortal = target.closest<HTMLElement>("[data-dialog-focus-allow]");
      if (allowedPortal?.dataset.dialogFocusAllow === dialogDomId) return;
    }
    focusInitialElement();
  }

  function captureReturnFocusTarget(document: Document): void {
    const activeElement = document.activeElement;
    returnFocusTarget = isHtmlElement(activeElement, document) ? activeElement : null;
  }

  function getReturnFocusTarget(enabled: boolean): HTMLElement | null {
    return enabled ? returnFocusTarget : null;
  }

  function focusReturnTarget(): boolean {
    return tryFocusElement(returnFocusTarget);
  }

  function transferFocusToNextDialog(
    returnFocus: boolean,
    nextWrapper: HTMLElement | undefined,
    focusNext: (() => void) | undefined,
  ): void {
    if (
      returnFocus &&
      returnFocusTarget?.isConnected &&
      nextWrapper?.contains(returnFocusTarget) &&
      tryFocusElement(returnFocusTarget)
    ) {
      return;
    }

    focusNext?.();
  }

  function adoptReturnFocus(target: HTMLElement | null, removedWrapper: HTMLElement): void {
    if (returnFocusTarget && removedWrapper.contains(returnFocusTarget)) {
      returnFocusTarget = target;
    }
  }

  function clearReturnFocusTarget(): void {
    returnFocusTarget = null;
  }

  return {
    adoptReturnFocus,
    captureReturnFocusTarget,
    clearReturnFocusTarget,
    focusInitialElement,
    focusReturnTarget,
    getReturnFocusTarget,
    handleFocusin,
    transferFocusToNextDialog,
    trapFocus,
  };
}
