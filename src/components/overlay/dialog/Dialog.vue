<!-- src/components/overlay/dialog/Dialog.vue -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, useId, watch } from "vue";
import type { CSSProperties, HTMLAttributes } from "vue";

import {
  isTopDialog,
  registerDialog,
  startDialogClose,
  unregisterDialog,
  updateDialogScrollLock,
} from "./internal/dialog-manager";
import type {
  DialogDismissReason,
  DialogRole,
  DialogSize,
  DialogSlotProps,
} from "./internal/dialog.types";
import { useAutoHeightMotion } from "./internal/use-auto-height-motion";

defineOptions({ inheritAttrs: false });

interface Props {
  modelValue: boolean;
  size?: DialogSize;
  /** Tailwind 最大宽度类；传入后优先于 size。 */
  maxWidth?: string;
  role?: DialogRole;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  lockScroll?: boolean;
  returnFocus?: boolean;
  /** 面板内的 CSS selector；未匹配时聚焦 autofocus、首个可聚焦元素或面板。 */
  initialFocus?: string;
  teleportTo?: string | HTMLElement;
  panelClass?: HTMLAttributes["class"];
  panelStyle?: HTMLAttributes["style"];
}

type TeleportedThemeStyle = CSSProperties & { "--app-hue"?: string };

const props = withDefaults(defineProps<Props>(), {
  size: "md",
  maxWidth: undefined,
  role: "dialog",
  ariaLabel: undefined,
  ariaLabelledby: undefined,
  ariaDescribedby: undefined,
  closeOnBackdrop: true,
  closeOnEscape: true,
  lockScroll: true,
  returnFocus: true,
  initialFocus: undefined,
  teleportTo: "body",
  panelClass: undefined,
  panelStyle: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  dismiss: [reason: DialogDismissReason];
  "after-open": [];
  "after-close": [];
}>();

defineSlots<{
  default(props: DialogSlotProps): unknown;
}>();

const SIZE_CLASS: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

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

function isHtmlElement(value: unknown, ownerDocument?: Document): value is HTMLElement {
  if (!value || typeof value !== "object") return false;
  const element = value as Element;
  if (
    element.nodeType !== 1 ||
    element.namespaceURI !== "http://www.w3.org/1999/xhtml" ||
    !element.ownerDocument
  ) {
    return false;
  }

  const HTMLElementConstructor = (ownerDocument ?? element.ownerDocument).defaultView?.HTMLElement;
  return HTMLElementConstructor ? value instanceof HTMLElementConstructor : true;
}

function isNodeInDocument(value: unknown, document: Document): value is Node {
  const NodeConstructor = document.defaultView?.Node;
  if (NodeConstructor) return value instanceof NodeConstructor;
  return Boolean(value && typeof value === "object" && "nodeType" in value);
}

function isElementInDocument(value: unknown, document: Document): value is Element {
  const ElementConstructor = document.defaultView?.Element;
  if (ElementConstructor) return value instanceof ElementConstructor;
  return isNodeInDocument(value, document) && value.nodeType === 1;
}

const dialogId = Symbol("ohmyui-dialog");
const originRef = ref<HTMLElement | null>(null);
const backdropRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const themeScope = ref<"light" | "dark" | undefined>();
const dialogDomId = `ohmyui-dialog-${useId()}`;
const themeStyle = ref<TeleportedThemeStyle>({});
const interactive = ref(false);
const stackLayer = ref(70);
const teleportSessionTarget = shallowRef<string | HTMLElement>();
const heightMotion = useAutoHeightMotion(panelRef, contentRef);

const widthClass = computed(() => props.maxWidth ?? SIZE_CLASS[props.size]);
const resolvedTeleportTarget = computed<string | HTMLElement>(
  () => teleportSessionTarget.value ?? props.teleportTo,
);

let activeDocument: Document | null = null;
let returnFocusTarget: HTMLElement | null = null;
let openGeneration = 0;
let registered = false;
let closePending = false;
let shouldReturnFocus = false;
let entranceFinished = false;
let disposed = false;

function resolveTeleportTargetForSession(): string | HTMLElement {
  const requestedTarget = props.teleportTo;
  const sourceDocument =
    originRef.value?.ownerDocument ?? (typeof document === "undefined" ? null : document);
  if (!sourceDocument) return requestedTarget;

  let targetElement: Element | null = null;
  try {
    targetElement =
      typeof requestedTarget === "string"
        ? sourceDocument.querySelector(requestedTarget)
        : isHtmlElement(requestedTarget)
          ? requestedTarget
          : null;
  } catch {
    return sourceDocument.body;
  }

  if (!isHtmlElement(targetElement) || !targetElement.isConnected) return sourceDocument.body;
  if (targetElement.closest("[data-ohmyui-dialog-layer]")) {
    return targetElement.ownerDocument.body;
  }
  return targetElement;
}

function lockTeleportSessionTarget(): void {
  if (teleportSessionTarget.value !== undefined) return;
  teleportSessionTarget.value = resolveTeleportTargetForSession();
}

function releaseTeleportSessionTarget(): void {
  teleportSessionTarget.value = undefined;
}

function resolveTeleportDocument(): Document | null {
  const target = resolvedTeleportTarget.value;
  if (typeof target !== "string" && isHtmlElement(target)) return target.ownerDocument;
  return originRef.value?.ownerDocument ?? (typeof document === "undefined" ? null : document);
}

function getFocusableElements(): HTMLElement[] {
  const panel = panelRef.value;
  if (!panel) return [];

  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true",
  );
}

function focusInitialElement(): void {
  const panel = panelRef.value;
  if (!panel) return;

  let requested: HTMLElement | null = null;
  if (props.initialFocus) {
    try {
      requested = panel.querySelector<HTMLElement>(props.initialFocus);
    } catch {
      requested = null;
    }
  }

  const target =
    requested ??
    panel.querySelector<HTMLElement>("[autofocus]") ??
    getFocusableElements()[0] ??
    panel;
  target.focus({ preventScroll: true });
}

function setInteractiveState(value: boolean): void {
  interactive.value = value;
  const backdrop = backdropRef.value;
  if (!backdrop) return;

  backdrop.inert = !value;
  if (value) backdrop.removeAttribute("aria-hidden");
  else backdrop.setAttribute("aria-hidden", "true");
}

function requestDismiss(reason: DialogDismissReason): void {
  if (!props.modelValue) return;
  emit("dismiss", reason);
  emit("update:modelValue", false);
}

function close(): void {
  requestDismiss("close");
}

function trapFocus(event: KeyboardEvent): void {
  const panel = panelRef.value;
  if (!panel) return;

  const focusable = getFocusableElements();
  if (focusable.length === 0) {
    event.preventDefault();
    panel.focus({ preventScroll: true });
    return;
  }

  const first = focusable[0];
  const last = focusable.at(-1);
  const document = panel.ownerDocument;
  const active = document.activeElement;
  const focusIsOutside = !isNodeInDocument(active, document) || !panel.contains(active);

  if (event.shiftKey && (active === first || active === panel || focusIsOutside)) {
    event.preventDefault();
    last?.focus({ preventScroll: true });
  } else if (!event.shiftKey && (active === last || focusIsOutside)) {
    event.preventDefault();
    first?.focus({ preventScroll: true });
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  const document = activeDocument;
  if (!document || !props.modelValue || !isTopDialog(document, dialogId)) return;

  if (event.key === "Escape" && props.closeOnEscape) {
    event.preventDefault();
    requestDismiss("escape");
  } else if (event.key === "Tab") {
    trapFocus(event);
  }
}

function handleDocumentFocusin(event: FocusEvent): void {
  const document = activeDocument;
  const panel = panelRef.value;
  const target = event.target;
  if (!document || !panel || !props.modelValue || !isTopDialog(document, dialogId)) return;
  if (!isNodeInDocument(target, document) || panel.contains(target)) return;
  if (isElementInDocument(target, document)) {
    const allowedPortal = target.closest<HTMLElement>("[data-dialog-focus-allow]");
    if (allowedPortal?.dataset.dialogFocusAllow === dialogDomId) return;
  }
  focusInitialElement();
}

function handleBackdropPointerDown(event: PointerEvent): void {
  if (
    event.button !== 0 ||
    event.target !== event.currentTarget ||
    !props.closeOnBackdrop ||
    !activeDocument ||
    !isTopDialog(activeDocument, dialogId)
  ) {
    return;
  }

  requestDismiss("backdrop");
}

function captureThemeContext(): void {
  const origin = originRef.value;
  const scope = origin?.closest(".light, .dark");
  themeScope.value = scope?.classList.contains("dark")
    ? "dark"
    : scope?.classList.contains("light")
      ? "light"
      : undefined;

  const view = origin?.ownerDocument.defaultView;
  const hue =
    origin && view ? view.getComputedStyle(origin).getPropertyValue("--app-hue").trim() : "";
  themeStyle.value = hue ? { "--app-hue": hue } : {};
}

function captureReturnFocusTarget(): void {
  const sourceDocument =
    originRef.value?.ownerDocument ?? (typeof document === "undefined" ? null : document);
  const activeElement = sourceDocument?.activeElement;
  returnFocusTarget =
    sourceDocument && isHtmlElement(activeElement, sourceDocument) ? activeElement : null;
}

function attachDocument(document: Document): void {
  if (activeDocument === document) return;
  if (activeDocument) detachDocument();

  activeDocument = document;
  document.addEventListener("keydown", handleDocumentKeydown);
  document.addEventListener("focusin", handleDocumentFocusin);
}

function detachDocument(): void {
  const document = activeDocument;
  if (!document) return;
  activeDocument = null;
  document.removeEventListener("keydown", handleDocumentKeydown);
  document.removeEventListener("focusin", handleDocumentFocusin);
}

function safelyRunMotion(action: () => void): void {
  try {
    action();
  } catch {
    // Motion is progressive enhancement; dialog ownership cleanup must continue.
  }
}

function transferFocusToNextDialog(
  nextWrapper: HTMLElement | undefined,
  focusNext: (() => void) | undefined,
): void {
  if (
    props.returnFocus &&
    returnFocusTarget?.isConnected &&
    nextWrapper?.contains(returnFocusTarget)
  ) {
    returnFocusTarget.focus({ preventScroll: true });
    return;
  }

  focusNext?.();
}

function adoptReturnFocus(target: HTMLElement | null, removedWrapper: HTMLElement): void {
  if (returnFocusTarget && removedWrapper.contains(returnFocusTarget)) {
    returnFocusTarget = target;
  }
}

function moveToDocument(document: Document): void {
  if (activeDocument === document) return;

  const previousDocument = activeDocument;
  try {
    if (previousDocument && registered) {
      unregisterDialog(previousDocument, dialogId, props.returnFocus ? returnFocusTarget : null);
    }
  } finally {
    registered = false;
    detachDocument();
  }
  attachDocument(document);
}

function unregisterActiveDialog() {
  const document = activeDocument;
  let removal: ReturnType<typeof unregisterDialog> | undefined;
  try {
    if (document && registered) {
      removal = unregisterDialog(document, dialogId, props.returnFocus ? returnFocusTarget : null);
    }
  } finally {
    registered = false;
    detachDocument();
  }
  return removal;
}

async function beginOpen(): Promise<void> {
  const generation = ++openGeneration;
  lockTeleportSessionTarget();
  closePending = false;
  shouldReturnFocus = false;
  entranceFinished = false;
  safelyRunMotion(heightMotion.prepare);

  if (!activeDocument) captureReturnFocusTarget();
  const preliminaryDocument = resolveTeleportDocument();
  if (!preliminaryDocument) return;
  if (!activeDocument) attachDocument(preliminaryDocument);

  await nextTick();
  if (disposed || generation !== openGeneration || !props.modelValue) return;

  const wrapper = backdropRef.value;
  if (!wrapper || !panelRef.value || !contentRef.value) return;

  const document = wrapper.ownerDocument;
  moveToDocument(document);
  captureThemeContext();
  stackLayer.value = registerDialog(document, {
    id: dialogId,
    locksScroll: props.lockScroll,
    wrapper,
    focus: focusInitialElement,
    setInteractive: setInteractiveState,
    adoptReturnFocus,
  });
  registered = true;

  safelyRunMotion(heightMotion.start);
  if (entranceFinished) safelyRunMotion(heightMotion.enable);
  focusInitialElement();
}

function prepareLeave(): void {
  openGeneration += 1;
  closePending = activeDocument !== null || teleportSessionTarget.value !== undefined;
  entranceFinished = false;
  safelyRunMotion(heightMotion.freeze);

  if (activeDocument) {
    if (!registered) {
      detachDocument();
      returnFocusTarget = null;
    } else {
      const transition = startDialogClose(activeDocument, dialogId);
      shouldReturnFocus = transition.wasTop && !transition.hasNextActive;
      if (transition.wasTop && transition.hasNextActive) {
        transferFocusToNextDialog(transition.nextWrapper, transition.focusNext);
      }
    }
  }

  const generation = openGeneration;
  void nextTick(() => {
    if (!props.modelValue && generation === openGeneration && !backdropRef.value) {
      finishClose();
    }
  });
}

function finishClose(emitEvent = true): void {
  if (props.modelValue || !closePending) return;
  closePending = false;
  safelyRunMotion(heightMotion.reset);

  const removal = unregisterActiveDialog();
  if (removal?.wasInteractive && removal.hasNextInteractive) {
    transferFocusToNextDialog(removal.nextWrapper, removal.focusNext);
  } else if (
    props.returnFocus &&
    shouldReturnFocus &&
    !removal?.hasNextInteractive &&
    returnFocusTarget?.isConnected
  ) {
    returnFocusTarget.focus({ preventScroll: true });
  }

  returnFocusTarget = null;
  themeScope.value = undefined;
  themeStyle.value = {};
  interactive.value = false;
  releaseTeleportSessionTarget();

  if (emitEvent) emit("after-close");
}

function handleAfterEnter(): void {
  if (!props.modelValue) return;
  entranceFinished = true;
  safelyRunMotion(heightMotion.enable);
  emit("after-open");
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) lockTeleportSessionTarget();
  },
  { immediate: true, flush: "sync" },
);

watch(
  () => props.modelValue,
  (open) => {
    if (open) void beginOpen();
    else prepareLeave();
  },
  { immediate: true, flush: "post" },
);

watch(
  () => props.lockScroll,
  (locksScroll) => {
    if (activeDocument && registered) {
      updateDialogScrollLock(activeDocument, dialogId, locksScroll);
    }
  },
);

onBeforeUnmount(() => {
  disposed = true;
  openGeneration += 1;
  safelyRunMotion(heightMotion.reset);

  const removal = unregisterActiveDialog();
  if (removal?.wasInteractive && removal.hasNextInteractive) {
    transferFocusToNextDialog(removal.nextWrapper, removal.focusNext);
  } else if (
    props.returnFocus &&
    removal?.wasInteractive &&
    !removal.hasNextInteractive &&
    returnFocusTarget?.isConnected
  ) {
    returnFocusTarget.focus({ preventScroll: true });
  }

  returnFocusTarget = null;
  releaseTeleportSessionTarget();
});
</script>

<template>
  <span ref="originRef" class="hidden" aria-hidden="true" />

  <Teleport :to="resolvedTeleportTarget">
    <Transition
      name="dialog-shell"
      appear
      @after-enter="handleAfterEnter"
      @after-leave="finishClose()"
    >
      <div
        v-if="props.modelValue"
        ref="backdropRef"
        :data-ohmyui-dialog-layer="dialogDomId"
        class="fixed inset-0 z-70 flex items-center justify-center bg-black/20 p-4 text-fg backdrop-blur-sm"
        :class="themeScope"
        :style="[{ zIndex: stackLayer }, themeStyle]"
        :inert="!interactive"
        :aria-hidden="interactive ? undefined : 'true'"
        @pointerdown="handleBackdropPointerDown"
      >
        <div
          v-bind="$attrs"
          ref="panelRef"
          data-ohmyui-dialog-panel
          :role="props.role"
          :aria-modal="interactive ? 'true' : undefined"
          :aria-label="props.ariaLabel"
          :aria-labelledby="props.ariaLabelledby"
          :aria-describedby="props.ariaDescribedby"
          tabindex="-1"
          :class="[
            'dialog-panel relative w-full overflow-hidden rounded-2xl bg-bg-card shadow-2xl',
            widthClass,
            props.panelClass,
          ]"
          :style="props.panelStyle"
        >
          <div ref="contentRef" class="flow-root">
            <slot :close="close" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-shell-enter-active {
  transition: opacity 0.22s cubic-bezier(0.2, 0, 0, 1);
}

.dialog-shell-leave-active {
  transition: opacity 0.16s ease-in;
}

.dialog-shell-enter-active .dialog-panel {
  transition:
    opacity 0.18s ease-out,
    transform 0.22s cubic-bezier(0.2, 0, 0, 1);
}

.dialog-shell-leave-active .dialog-panel {
  transition:
    opacity 0.14s ease-in,
    transform 0.16s ease-in;
}

.dialog-shell-enter-from,
.dialog-shell-leave-to {
  opacity: 0;
}

.dialog-shell-enter-from .dialog-panel {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}

.dialog-shell-leave-to .dialog-panel {
  opacity: 0;
  transform: translateY(3px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .dialog-shell-enter-active,
  .dialog-shell-leave-active,
  .dialog-shell-enter-active .dialog-panel,
  .dialog-shell-leave-active .dialog-panel {
    transition: none;
  }
}
</style>
