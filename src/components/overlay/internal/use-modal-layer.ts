import { nextTick, onBeforeUnmount, ref, useId, watch, type Ref } from "vue";

import {
  isTopDialog,
  registerDialog,
  startDialogClose,
  unregisterDialog,
  updateDialogScrollLock,
} from "../dialog/internal/dialog-manager";
import { useDialogFocus, type DialogFocusFallback } from "../dialog/internal/use-dialog-focus";
import { useDialogSession } from "../dialog/internal/use-dialog-session";
import { getDialogOwnedPortals } from "./dialog-owner";
import { registerDismissableLayer } from "./dismissable-layer";

interface UseModalLayerOptions<DismissReason extends string> {
  open: () => boolean;
  originRef: Ref<HTMLElement | null>;
  wrapperRef: Ref<HTMLElement | null>;
  panelRef: Ref<HTMLElement | null>;
  teleportTo: () => string | HTMLElement;
  lockScroll: () => boolean;
  returnFocus: () => boolean;
  initialFocus: () => string | undefined;
  focusFallback?: DialogFocusFallback;
  closeOnEscape: () => boolean;
  closeOnPointerOutside: () => boolean;
  escapeReason: DismissReason;
  pointerOutsideReason: DismissReason;
  onDismiss: (reason: DismissReason) => void;
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
}

/**
 * Dialog 与 BottomSheet 共用的无视觉模态生命周期。
 *
 * DOM、动画和布局由调用方负责；这里集中管理 Teleport、主题继承、模态栈、
 * Escape/outside 仲裁、焦点、背景隔离、滚动锁及离场后的资源释放。
 */
export function useModalLayer<DismissReason extends string>(
  options: UseModalLayerOptions<DismissReason>,
) {
  const modalId = Symbol("ohmyui-modal-layer");
  const modalDomId = `ohmyui-dialog-${useId()}`;
  const interactive = ref(false);
  const stackLayer = ref(70);

  const modalFocus = useDialogFocus({
    panelRef: options.panelRef,
    initialFocus: options.initialFocus,
    dialogDomId: modalDomId,
    focusFallback: options.focusFallback,
  });
  const modalSession = useDialogSession({
    originRef: options.originRef,
    teleportTo: options.teleportTo,
  });

  let activeDocument: Document | null = null;
  let unregisterDismissableLayer: (() => void) | undefined;
  let registered = false;
  let closePending = false;
  let shouldReturnFocus = false;

  function setInteractiveState(value: boolean): void {
    interactive.value = value;
    const wrapper = options.wrapperRef.value;
    if (!wrapper) return;

    wrapper.inert = !value;
    if (value) wrapper.removeAttribute("aria-hidden");
    else wrapper.setAttribute("aria-hidden", "true");
  }

  function requestDismiss(reason: DismissReason): void {
    if (!options.open()) return;
    options.onDismiss(reason);
  }

  function handleDocumentKeydown(event: KeyboardEvent): void {
    const document = activeDocument;
    if (
      event.defaultPrevented ||
      event.key !== "Tab" ||
      !document ||
      !options.open() ||
      !isTopDialog(document, modalId)
    ) {
      return;
    }
    modalFocus.trapFocus(event);
  }

  function handleDocumentFocusin(event: FocusEvent): void {
    const document = activeDocument;
    if (!document || !options.open() || !isTopDialog(document, modalId)) return;
    modalFocus.handleFocusin(event, document);
  }

  function attachDocument(document: Document): void {
    if (activeDocument === document) return;
    if (activeDocument) detachDocument();

    activeDocument = document;
    document.addEventListener("keydown", handleDocumentKeydown);
    document.addEventListener("focusin", handleDocumentFocusin);
    unregisterDismissableLayer = registerDismissableLayer(document, {
      id: modalId,
      isActive: () => options.open() && registered && isTopDialog(document, modalId),
      onEscape: () => {
        if (!options.closeOnEscape()) return false;
        requestDismiss(options.escapeReason);
        return true;
      },
      getContainers: () => [options.panelRef.value, ...getDialogOwnedPortals(document, modalDomId)],
      onPointerDownOutside: () => {
        if (!options.panelRef.value || !options.closeOnPointerOutside()) return;
        requestDismiss(options.pointerOutsideReason);
      },
    });
  }

  function detachDocument(): void {
    const document = activeDocument;
    if (!document) return;

    activeDocument = null;
    unregisterDismissableLayer?.();
    unregisterDismissableLayer = undefined;
    document.removeEventListener("keydown", handleDocumentKeydown);
    document.removeEventListener("focusin", handleDocumentFocusin);
  }

  function moveToDocument(document: Document): void {
    if (activeDocument === document) return;

    const previousDocument = activeDocument;
    try {
      if (previousDocument && registered) {
        unregisterDialog(
          previousDocument,
          modalId,
          modalFocus.getReturnFocusTarget(options.returnFocus()),
        );
      }
    } finally {
      registered = false;
      detachDocument();
    }
    attachDocument(document);
  }

  function unregisterActiveModal(): ReturnType<typeof unregisterDialog> | undefined {
    const document = activeDocument;
    let removal: ReturnType<typeof unregisterDialog> | undefined;
    try {
      if (document && registered) {
        removal = unregisterDialog(
          document,
          modalId,
          modalFocus.getReturnFocusTarget(options.returnFocus()),
        );
      }
    } finally {
      registered = false;
      detachDocument();
    }
    return removal;
  }

  async function beginOpen(): Promise<void> {
    const generation = modalSession.beginOpenAttempt();
    closePending = false;
    shouldReturnFocus = false;

    if (!activeDocument) {
      const sourceDocument =
        options.originRef.value?.ownerDocument ??
        (typeof document === "undefined" ? null : document);
      if (sourceDocument) modalFocus.captureReturnFocusTarget(sourceDocument);
    }

    const preliminaryDocument = modalSession.resolveTeleportDocument();
    if (!preliminaryDocument) return;
    if (!activeDocument) attachDocument(preliminaryDocument);

    await nextTick();
    if (!modalSession.isCurrentAttempt(generation) || !options.open()) return;

    const wrapper = options.wrapperRef.value;
    if (!wrapper || !options.panelRef.value) return;

    const ownerDocument = wrapper.ownerDocument;
    moveToDocument(ownerDocument);
    modalSession.captureThemeContext();
    stackLayer.value = registerDialog(ownerDocument, {
      id: modalId,
      locksScroll: options.lockScroll(),
      wrapper,
      focus: modalFocus.focusInitialElement,
      setInteractive: setInteractiveState,
      adoptReturnFocus: modalFocus.adoptReturnFocus,
    });
    registered = true;

    modalFocus.focusInitialElement();
  }

  function prepareLeave(): void {
    // 先让出 active 身份，离场完成后再释放背景隔离与滚动锁。
    const generation = modalSession.invalidateAttempt();
    closePending = activeDocument !== null || modalSession.hasLockedTeleportTarget();

    if (activeDocument) {
      if (!registered) {
        detachDocument();
        modalFocus.clearReturnFocusTarget();
      } else {
        const transition = startDialogClose(activeDocument, modalId);
        shouldReturnFocus = transition.wasTop && !transition.hasNextActive;
        if (transition.wasTop && transition.hasNextActive) {
          modalFocus.transferFocusToNextDialog(
            options.returnFocus(),
            transition.nextWrapper,
            transition.focusNext,
          );
        }
      }
    }

    void nextTick(() => {
      if (
        !options.open() &&
        modalSession.isCurrentAttempt(generation) &&
        !options.wrapperRef.value
      ) {
        finishClose();
      }
    });
  }

  function finishClose(emitEvent = true): void {
    if (options.open() || !closePending) return;
    closePending = false;

    const removal = unregisterActiveModal();
    if (removal?.wasInteractive && removal.hasNextInteractive) {
      modalFocus.transferFocusToNextDialog(
        options.returnFocus(),
        removal.nextWrapper,
        removal.focusNext,
      );
    } else if (options.returnFocus() && shouldReturnFocus && !removal?.hasNextInteractive) {
      modalFocus.focusReturnTarget();
    }

    modalFocus.clearReturnFocusTarget();
    modalSession.clearThemeContext();
    interactive.value = false;
    modalSession.releaseTeleportTarget();

    if (emitEvent) options.onAfterClose?.();
  }

  function handleAfterEnter(): void {
    if (options.open()) options.onAfterOpen?.();
  }

  watch(
    options.open,
    (open) => {
      if (open) modalSession.lockTeleportTarget();
    },
    { immediate: true, flush: "sync" },
  );

  watch(
    options.open,
    (open) => {
      if (open) void beginOpen();
      else prepareLeave();
    },
    { immediate: true, flush: "post" },
  );

  watch(options.lockScroll, (locksScroll) => {
    if (activeDocument && registered) {
      updateDialogScrollLock(activeDocument, modalId, locksScroll);
    }
  });

  onBeforeUnmount(() => {
    modalSession.dispose();

    const removal = unregisterActiveModal();
    if (removal?.wasInteractive && removal.hasNextInteractive) {
      modalFocus.transferFocusToNextDialog(
        options.returnFocus(),
        removal.nextWrapper,
        removal.focusNext,
      );
    } else if (options.returnFocus() && removal?.wasInteractive && !removal.hasNextInteractive) {
      modalFocus.focusReturnTarget();
    }

    modalFocus.clearReturnFocusTarget();
    modalSession.clearThemeContext();
    modalSession.releaseTeleportTarget();
  });

  return {
    finishClose,
    handleAfterEnter,
    interactive,
    modalDomId,
    requestDismiss,
    resolvedTeleportTarget: modalSession.resolvedTeleportTarget,
    stackLayer,
    themeScope: modalSession.themeScope,
    themeStyle: modalSession.themeStyle,
  };
}
