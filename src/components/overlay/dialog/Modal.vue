<!-- src/components/overlay/dialog/Modal.vue -->
<script setup lang="ts">
import { computed, ref, useId, useSlots, watch } from "vue";
import type { HTMLAttributes } from "vue";

import Dialog from "./Dialog.vue";
import type {
  DialogDismissReason,
  DialogRole,
  DialogSize,
  DialogSlotProps,
} from "./internal/dialog.types";
import { useModalBodyMotion } from "./internal/use-modal-body-motion";

defineOptions({ inheritAttrs: false });

interface Props {
  modelValue: boolean;
  size?: DialogSize;
  /** 自定义最大宽度工具类；传入后优先于 size。 */
  maxWidth?: string;
  role?: DialogRole;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  lockScroll?: boolean;
  returnFocus?: boolean;
  initialFocus?: string;
  teleportTo?: string | HTMLElement;
  panelClass?: HTMLAttributes["class"];
  panelStyle?: HTMLAttributes["style"];
}

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

const slots = useSlots();
defineSlots<{
  header?(props: DialogSlotProps): unknown;
  default(props: DialogSlotProps): unknown;
  footer?(props: DialogSlotProps): unknown;
}>();

const generatedTitleId = `modal-title-${useId()}`;
const internalTitleId = computed(() =>
  !props.ariaLabel && !props.ariaLabelledby && slots.header ? generatedTitleId : undefined,
);
const resolvedLabelledby = computed(() => props.ariaLabelledby ?? internalTitleId.value);
const resolvedAriaLabel = computed(() =>
  resolvedLabelledby.value ? undefined : (props.ariaLabel ?? "Dialog"),
);
const bodyRef = ref<HTMLElement | null>(null);
const layoutRootRef = computed(() => bodyRef.value?.parentElement ?? null);
const bodyMotion = useModalBodyMotion(bodyRef);
const layoutMotion = useModalBodyMotion(layoutRootRef);
let warnedAboutMissingName = false;

function handleAfterOpen(): void {
  bodyMotion.enable();
  layoutMotion.enable();
  emit("after-open");
}

function handleAfterClose(): void {
  bodyMotion.disable();
  layoutMotion.disable();
  emit("after-close");
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      bodyMotion.prepareForOpen();
      layoutMotion.prepareForOpen();
    } else {
      bodyMotion.suspend();
      layoutMotion.suspend();
    }
  },
  { immediate: true, flush: "sync" },
);

watch(
  () => props.modelValue,
  (open) => {
    if (
      !import.meta.env.DEV ||
      !open ||
      warnedAboutMissingName ||
      props.ariaLabel ||
      props.ariaLabelledby ||
      slots.header
    ) {
      return;
    }

    warnedAboutMissingName = true;
    // oxlint-disable-next-line no-console
    console.warn("Modal 需要 header slot、aria-label 或 aria-labelledby 作为无障碍名称。");
  },
  { immediate: true },
);
</script>

<template>
  <Dialog
    v-bind="$attrs"
    :model-value="props.modelValue"
    :size="props.size"
    :max-width="props.maxWidth"
    :role="props.role"
    :aria-label="resolvedAriaLabel"
    :aria-labelledby="resolvedLabelledby"
    :aria-describedby="props.ariaDescribedby"
    :close-on-backdrop="props.closeOnBackdrop"
    :close-on-escape="props.closeOnEscape"
    :lock-scroll="props.lockScroll"
    :return-focus="props.returnFocus"
    :initial-focus="props.initialFocus"
    :teleport-to="props.teleportTo"
    :panel-class="props.panelClass"
    :panel-style="props.panelStyle"
    @update:model-value="emit('update:modelValue', $event)"
    @dismiss="emit('dismiss', $event)"
    @after-open="handleAfterOpen"
    @after-close="handleAfterClose"
  >
    <template #default="{ close }">
      <div v-if="slots.header" :id="internalTitleId" class="px-6 py-4">
        <slot name="header" :close="close" />
      </div>

      <div ref="bodyRef" class="px-6 py-8">
        <slot :close="close" />
      </div>

      <div v-if="slots.footer" class="flex items-center justify-end gap-3 px-6 py-4">
        <slot name="footer" :close="close" />
      </div>
    </template>
  </Dialog>
</template>
