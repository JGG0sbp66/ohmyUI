<!-- src/components/overlay/dialog/Dialog.vue -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from "vue";

import { registerDismissableLayer } from "../internal/dismissable-layer";
import {
  isTopDialog,
  registerDialog,
  startDialogClose,
  unregisterDialog,
  updateDialogScrollLock,
} from "./internal/dialog-manager";
import type {
  DialogEmits,
  DialogProps,
  DialogSize,
  DialogSlotProps,
} from "./internal/dialog.types";
import { useDialogFocus } from "./internal/use-dialog-focus";
import { useDialogSession } from "./internal/use-dialog-session";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<DialogProps>(), {
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

const emit = defineEmits<DialogEmits>();

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

const dialogId = Symbol("ohmyui-dialog");
const originRef = ref<HTMLElement | null>(null);
const backdropRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const dialogDomId = `ohmyui-dialog-${useId()}`;
const interactive = ref(false);
const stackLayer = ref(70);
const widthClass = computed(() => props.maxWidth ?? SIZE_CLASS[props.size]);

const dialogFocus = useDialogFocus({
  panelRef,
  initialFocus: () => props.initialFocus,
  dialogDomId,
});
const dialogSession = useDialogSession({
  originRef,
  teleportTo: () => props.teleportTo,
});
const { resolvedTeleportTarget, themeScope, themeStyle } = dialogSession;

let activeDocument: Document | null = null;
let unregisterDismissableLayer: (() => void) | undefined;
let registered = false;
let closePending = false;
let shouldReturnFocus = false;

function setInteractiveState(value: boolean): void {
  interactive.value = value;
  const backdrop = backdropRef.value;
  if (!backdrop) return;

  backdrop.inert = !value;
  if (value) backdrop.removeAttribute("aria-hidden");
  else backdrop.setAttribute("aria-hidden", "true");
}

function requestDismiss(reason: DialogEmits["dismiss"][0]): void {
  if (!props.modelValue) return;
  emit("dismiss", reason);
  emit("update:modelValue", false);
}

function close(): void {
  requestDismiss("close");
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  const document = activeDocument;
  if (
    event.defaultPrevented ||
    event.key !== "Tab" ||
    !document ||
    !props.modelValue ||
    !isTopDialog(document, dialogId)
  ) {
    return;
  }
  dialogFocus.trapFocus(event);
}

function handleDocumentFocusin(event: FocusEvent): void {
  const document = activeDocument;
  if (!document || !props.modelValue || !isTopDialog(document, dialogId)) return;
  dialogFocus.handleFocusin(event, document);
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

function attachDocument(document: Document): void {
  if (activeDocument === document) return;
  if (activeDocument) detachDocument();

  activeDocument = document;
  document.addEventListener("keydown", handleDocumentKeydown);
  document.addEventListener("focusin", handleDocumentFocusin);
  unregisterDismissableLayer = registerDismissableLayer(document, {
    id: dialogId,
    isActive: () => props.modelValue && registered && isTopDialog(document, dialogId),
    onEscape: () => {
      if (!props.closeOnEscape) return false;
      requestDismiss("escape");
      return true;
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
        dialogId,
        dialogFocus.getReturnFocusTarget(props.returnFocus),
      );
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
      removal = unregisterDialog(
        document,
        dialogId,
        dialogFocus.getReturnFocusTarget(props.returnFocus),
      );
    }
  } finally {
    registered = false;
    detachDocument();
  }
  return removal;
}

async function beginOpen(): Promise<void> {
  const generation = dialogSession.beginOpenAttempt();
  closePending = false;
  shouldReturnFocus = false;

  if (!activeDocument) {
    const sourceDocument =
      originRef.value?.ownerDocument ?? (typeof document === "undefined" ? null : document);
    if (sourceDocument) dialogFocus.captureReturnFocusTarget(sourceDocument);
  }

  const preliminaryDocument = dialogSession.resolveTeleportDocument();
  if (!preliminaryDocument) return;
  if (!activeDocument) attachDocument(preliminaryDocument);

  await nextTick();
  if (!dialogSession.isCurrentAttempt(generation) || !props.modelValue) return;

  const wrapper = backdropRef.value;
  if (!wrapper || !panelRef.value) return;

  const ownerDocument = wrapper.ownerDocument;
  moveToDocument(ownerDocument);
  dialogSession.captureThemeContext();
  stackLayer.value = registerDialog(ownerDocument, {
    id: dialogId,
    locksScroll: props.lockScroll,
    wrapper,
    focus: dialogFocus.focusInitialElement,
    setInteractive: setInteractiveState,
    adoptReturnFocus: dialogFocus.adoptReturnFocus,
  });
  registered = true;

  dialogFocus.focusInitialElement();
}

function prepareLeave(): void {
  const generation = dialogSession.invalidateAttempt();
  closePending = activeDocument !== null || dialogSession.hasLockedTeleportTarget();

  if (activeDocument) {
    if (!registered) {
      detachDocument();
      dialogFocus.clearReturnFocusTarget();
    } else {
      const transition = startDialogClose(activeDocument, dialogId);
      shouldReturnFocus = transition.wasTop && !transition.hasNextActive;
      if (transition.wasTop && transition.hasNextActive) {
        dialogFocus.transferFocusToNextDialog(
          props.returnFocus,
          transition.nextWrapper,
          transition.focusNext,
        );
      }
    }
  }

  void nextTick(() => {
    if (!props.modelValue && dialogSession.isCurrentAttempt(generation) && !backdropRef.value) {
      finishClose();
    }
  });
}

function finishClose(emitEvent = true): void {
  if (props.modelValue || !closePending) return;
  closePending = false;

  const removal = unregisterActiveDialog();
  if (removal?.wasInteractive && removal.hasNextInteractive) {
    dialogFocus.transferFocusToNextDialog(
      props.returnFocus,
      removal.nextWrapper,
      removal.focusNext,
    );
  } else if (props.returnFocus && shouldReturnFocus && !removal?.hasNextInteractive) {
    dialogFocus.focusReturnTarget();
  }

  dialogFocus.clearReturnFocusTarget();
  dialogSession.clearThemeContext();
  interactive.value = false;
  dialogSession.releaseTeleportTarget();

  if (emitEvent) emit("after-close");
}

function handleAfterEnter(): void {
  if (!props.modelValue) return;
  emit("after-open");
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) dialogSession.lockTeleportTarget();
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
  dialogSession.dispose();

  const removal = unregisterActiveDialog();
  if (removal?.wasInteractive && removal.hasNextInteractive) {
    dialogFocus.transferFocusToNextDialog(
      props.returnFocus,
      removal.nextWrapper,
      removal.focusNext,
    );
  } else if (props.returnFocus && removal?.wasInteractive && !removal.hasNextInteractive) {
    dialogFocus.focusReturnTarget();
  }

  dialogFocus.clearReturnFocusTarget();
  dialogSession.clearThemeContext();
  dialogSession.releaseTeleportTarget();
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
        class="fixed inset-0 z-70 flex items-start justify-center overflow-y-auto bg-black/20 p-4 text-fg backdrop-blur-sm"
        :class="themeScope"
        :style="[{ zIndex: stackLayer }, themeStyle]"
        :inert="!interactive"
        :aria-hidden="interactive ? undefined : 'true'"
      >
        <div
          data-ohmyui-dialog-backdrop
          class="fixed inset-0"
          aria-hidden="true"
          @pointerdown="handleBackdropPointerDown"
        />

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
            'dialog-panel relative z-10 my-auto w-full overflow-hidden rounded-2xl bg-bg-card shadow-2xl',
            widthClass,
            props.panelClass,
          ]"
          :style="props.panelStyle"
        >
          <div class="flow-root">
            <slot :close="close" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-shell-enter-active {
  transition: opacity 0.15s ease-out;
}

.dialog-shell-leave-active {
  transition: opacity 0.1s ease-in;
}

.dialog-shell-enter-active .dialog-panel {
  transition:
    opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-shell-leave-active .dialog-panel {
  transition:
    opacity 0.12s ease-in,
    transform 0.12s ease-in;
}

.dialog-shell-enter-from,
.dialog-shell-leave-to {
  opacity: 0;
}

.dialog-shell-enter-from .dialog-panel {
  opacity: 0;
  transform: scale(0.9);
}

.dialog-shell-leave-to .dialog-panel {
  opacity: 0;
  transform: scale(0.95);
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
