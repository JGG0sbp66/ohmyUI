<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from "vue";

import ButtonIcon from "../../button/ButtonIcon.vue";
import { useModalLayer } from "../internal/use-modal-layer";
import type {
  BottomSheetDismissReason,
  BottomSheetEmits,
  BottomSheetHeaderSlotProps,
  BottomSheetProps,
  BottomSheetSlotProps,
} from "./internal/bottom-sheet.types";
import { useBottomSheetMotion } from "./internal/use-bottom-sheet-motion";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<BottomSheetProps>(), {
  title: undefined,
  description: undefined,
  closeLabel: "Close",
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
  draggable: true,
  panelClass: undefined,
  panelStyle: undefined,
});

const emit = defineEmits<BottomSheetEmits>();
const slots = useSlots();
defineSlots<{
  header?(props: BottomSheetHeaderSlotProps): unknown;
  default?(props: BottomSheetSlotProps): unknown;
  footer?(props: BottomSheetSlotProps): unknown;
}>();

const originRef = ref<HTMLElement | null>(null);
const layerRef = ref<HTMLElement | null>(null);
const motionRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const reducedMotion = ref(false);
const generatedTitleId = `bottom-sheet-title-${useId()}`;
const generatedDescriptionId = `bottom-sheet-description-${useId()}`;
const hasHeader = computed(() => Boolean(props.title || slots.header));
const internalTitleId = computed(() =>
  !props.ariaLabel && !props.ariaLabelledby && hasHeader.value ? generatedTitleId : undefined,
);
const internalDescriptionId = computed(() =>
  !props.ariaDescribedby && props.title && props.description && !slots.header
    ? generatedDescriptionId
    : undefined,
);
const resolvedLabelledby = computed(() => props.ariaLabelledby ?? internalTitleId.value);
const resolvedAriaLabel = computed(() =>
  resolvedLabelledby.value ? undefined : (props.ariaLabel ?? "Bottom sheet"),
);
const resolvedDescribedby = computed(() => props.ariaDescribedby ?? internalDescriptionId.value);
const transitionDuration = computed(() => (reducedMotion.value ? 0 : { enter: 250, leave: 180 }));
let warnedAboutMissingName = false;
let reducedMotionQuery: MediaQueryList | undefined;

const {
  finishClose,
  handleAfterEnter,
  interactive,
  modalDomId,
  requestDismiss,
  resolvedTeleportTarget,
  stackLayer,
  themeScope,
  themeStyle,
} = useModalLayer<BottomSheetDismissReason>({
  open: () => props.modelValue,
  originRef,
  wrapperRef: layerRef,
  panelRef,
  teleportTo: () => props.teleportTo,
  lockScroll: () => props.lockScroll,
  returnFocus: () => props.returnFocus,
  initialFocus: () =>
    props.initialFocus ?? (props.title && !slots.header ? "[data-bottom-sheet-close]" : undefined),
  focusFallback: "panel",
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

const motion = useBottomSheetMotion({
  motionRef,
  open: () => props.modelValue,
  enabled: () => props.draggable,
  onDismiss: () => requestDismiss("drag"),
  onExpandedChange: (expanded) => emit("expanded-change", expanded),
});

function close(): void {
  requestDismiss("close");
}

function handleAfterLeave(): void {
  motion.resetAfterLeave();
  finishClose();
}

function syncReducedMotion(event?: MediaQueryListEvent): void {
  reducedMotion.value = event?.matches ?? reducedMotionQuery?.matches ?? false;
}

onMounted(() => {
  const view =
    originRef.value?.ownerDocument.defaultView ?? (typeof window === "undefined" ? null : window);
  reducedMotionQuery = view?.matchMedia("(prefers-reduced-motion: reduce)");
  syncReducedMotion();
  reducedMotionQuery?.addEventListener("change", syncReducedMotion);
});

onBeforeUnmount(() => {
  reducedMotionQuery?.removeEventListener("change", syncReducedMotion);
  reducedMotionQuery = undefined;
});

watch(
  () => props.modelValue,
  (open) => {
    if (
      !import.meta.env.DEV ||
      !open ||
      warnedAboutMissingName ||
      props.ariaLabel ||
      props.ariaLabelledby ||
      hasHeader.value
    ) {
      return;
    }

    warnedAboutMissingName = true;
    // oxlint-disable-next-line no-console
    console.warn(
      "BottomSheet 需要 title、header slot、aria-label 或 aria-labelledby 作为无障碍名称。",
    );
  },
  { immediate: true },
);
</script>

<template>
  <span ref="originRef" class="hidden" aria-hidden="true" />

  <Teleport :to="resolvedTeleportTarget">
    <Transition
      name="bottom-sheet-shell"
      appear
      :duration="transitionDuration"
      @after-enter="handleAfterEnter"
      @after-leave="handleAfterLeave"
    >
      <div
        v-if="props.modelValue"
        ref="layerRef"
        :data-ohmyui-dialog-layer="modalDomId"
        data-ohmyui-bottom-sheet-layer
        class="fixed inset-0 z-70 text-fg"
        :class="themeScope"
        :style="[{ zIndex: stackLayer }, themeStyle]"
        :inert="!interactive"
        :aria-hidden="interactive ? undefined : 'true'"
      >
        <div
          data-ohmyui-bottom-sheet-backdrop
          class="bottom-sheet-backdrop fixed inset-0 bg-black/45 backdrop-blur-[2px]"
          aria-hidden="true"
        />

        <div
          ref="motionRef"
          class="bottom-sheet-motion fixed inset-x-0 bottom-0 z-10"
          :data-expanded="motion.isExpanded.value ? 'true' : undefined"
          :data-dragging="motion.isDragging.value ? 'true' : undefined"
          :style="motion.motionStyle.value"
        >
          <section
            v-bind="$attrs"
            ref="panelRef"
            data-ohmyui-bottom-sheet-panel
            :role="props.role"
            :aria-modal="interactive ? 'true' : undefined"
            :aria-label="resolvedAriaLabel"
            :aria-labelledby="resolvedLabelledby"
            :aria-describedby="resolvedDescribedby"
            tabindex="-1"
            :class="[
              'bottom-sheet-panel flex w-full flex-col overflow-hidden rounded-t-3xl border-t border-border/50 bg-bg-card px-4 pt-2 shadow-[0_-16px_48px_rgba(0,0,0,0.24)]',
              props.panelClass,
            ]"
            :style="[props.panelStyle, { paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }]"
          >
            <div
              v-if="props.draggable"
              class="mx-auto mb-1 flex h-5 w-16 touch-none items-center justify-center"
              :class="motion.isDragging.value ? 'cursor-grabbing' : 'cursor-grab'"
              aria-hidden="true"
              @pointerdown="motion.onPointerDown"
              @pointermove="motion.onPointerMove"
              @pointerup="motion.onPointerEnd"
              @pointercancel="motion.onPointerEnd($event, true)"
              @lostpointercapture="motion.onLostPointerCapture"
            >
              <div class="h-1 w-10 rounded-full bg-fg-muted/25" />
            </div>

            <div v-if="hasHeader" :id="internalTitleId" class="mb-3">
              <slot
                name="header"
                :close="close"
                :expanded="motion.isExpanded.value"
                :title-id="internalTitleId"
                :description-id="internalDescriptionId"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <h2 class="text-base font-semibold text-fg">{{ props.title }}</h2>
                    <p
                      v-if="props.description"
                      :id="internalDescriptionId"
                      class="mt-0.5 text-xs text-fg-muted"
                    >
                      {{ props.description }}
                    </p>
                  </div>
                  <ButtonIcon
                    data-bottom-sheet-close
                    :label="props.closeLabel"
                    class="size-9 shrink-0"
                    @click="close"
                  >
                    <svg
                      class="size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </ButtonIcon>
                </div>
              </slot>
            </div>

            <div
              data-ohmyui-bottom-sheet-content
              class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              <slot :close="close" :expanded="motion.isExpanded.value" />
            </div>

            <div v-if="slots.footer" class="shrink-0 pt-3">
              <slot name="footer" :close="close" :expanded="motion.isExpanded.value" />
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bottom-sheet-panel {
  height: 100%;
  max-height: inherit;
}

.bottom-sheet-shell-enter-active .bottom-sheet-backdrop {
  transition: opacity 200ms ease-out;
}

.bottom-sheet-shell-leave-active .bottom-sheet-backdrop {
  transition: opacity 150ms ease-in;
}

.bottom-sheet-shell-enter-active .bottom-sheet-motion {
  transition: transform 250ms cubic-bezier(0.22, 1, 0.36, 1);
}

.bottom-sheet-shell-leave-active .bottom-sheet-motion {
  transition: transform 180ms ease-in;
}

.bottom-sheet-shell-enter-from .bottom-sheet-backdrop,
.bottom-sheet-shell-leave-to .bottom-sheet-backdrop {
  opacity: 0;
}

.bottom-sheet-shell-enter-from .bottom-sheet-motion,
.bottom-sheet-shell-leave-to .bottom-sheet-motion {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .bottom-sheet-shell-enter-active .bottom-sheet-backdrop,
  .bottom-sheet-shell-leave-active .bottom-sheet-backdrop,
  .bottom-sheet-shell-enter-active .bottom-sheet-motion,
  .bottom-sheet-shell-leave-active .bottom-sheet-motion {
    transition: none;
  }
}
</style>
