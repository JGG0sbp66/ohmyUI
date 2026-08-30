<!-- src/components/overlay/dialog/Dialog.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";

import { useModalLayer } from "../internal/use-modal-layer";
import type {
  DialogDismissReason,
  DialogEmits,
  DialogProps,
  DialogSize,
  DialogSlotProps,
} from "./internal/dialog.types";

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

const originRef = ref<HTMLElement | null>(null);
const backdropRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const widthClass = computed(() => props.maxWidth ?? SIZE_CLASS[props.size]);

const {
  finishClose,
  handleAfterEnter,
  interactive,
  modalDomId: dialogDomId,
  requestDismiss,
  resolvedTeleportTarget,
  stackLayer,
  themeScope,
  themeStyle,
} = useModalLayer<DialogDismissReason>({
  open: () => props.modelValue,
  originRef,
  wrapperRef: backdropRef,
  panelRef,
  teleportTo: () => props.teleportTo,
  lockScroll: () => props.lockScroll,
  returnFocus: () => props.returnFocus,
  initialFocus: () => props.initialFocus,
  closeOnEscape: () => props.closeOnEscape,
  closeOnPointerOutside: () => props.closeOnBackdrop,
  escapeReason: "escape",
  pointerOutsideReason: "backdrop",
  onDismiss: (reason) => {
    emit("dismiss", reason);
    emit("update:modelValue", false);
  },
  onAfterOpen: () => emit("after-open"),
  onAfterClose: () => emit("after-close"),
});

function close(): void {
  requestDismiss("close");
}
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
        <div data-ohmyui-dialog-backdrop class="fixed inset-0" aria-hidden="true" />

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

</style>
