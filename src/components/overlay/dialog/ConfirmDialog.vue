<!-- src/components/overlay/dialog/ConfirmDialog.vue -->
<script setup lang="ts">
import { Info, TriangleAlert } from "@lucide/vue";
import { computed, useId, useSlots } from "vue";

import ButtonPrimary from "../../button/ButtonPrimary.vue";
import ButtonSecondary from "../../button/ButtonSecondary.vue";
import type { ConfirmDialogEmits, ConfirmDialogProps } from "./confirm.types";
import { CONFIRM_DIALOG_DEFAULTS } from "./internal/confirm.defaults";
import Modal from "./Modal.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ConfirmDialogProps>(), CONFIRM_DIALOG_DEFAULTS);

const emit = defineEmits<ConfirmDialogEmits>();

const slots = useSlots();
defineSlots<{
  icon?(): unknown;
  title?(): unknown;
  question?(): unknown;
  default?(): unknown;
  list?(): unknown;
  warning?(): unknown;
}>();

const questionId = `confirm-question-${useId()}`;
const warningId = `confirm-warning-${useId()}`;
const describedby = computed(() =>
  props.warning || slots.warning ? `${questionId} ${warningId}` : questionId,
);
const resolvedIconClass = computed(
  () => props.iconClass ?? (props.danger ? "text-danger" : "text-accent"),
);

function cancel(): void {
  emit("cancel");
  emit("update:modelValue", false);
}
</script>

<template>
  <Modal
    v-bind="$attrs"
    :model-value="props.modelValue"
    max-width="max-w-lg"
    role="alertdialog"
    :aria-describedby="describedby"
    :close-on-backdrop="props.closeOnBackdrop"
    :close-on-escape="props.closeOnEscape"
    :lock-scroll="props.lockScroll"
    :return-focus="props.returnFocus"
    initial-focus="[data-confirm-cancel]"
    :teleport-to="props.teleportTo"
    :panel-class="props.panelClass"
    @update:model-value="emit('update:modelValue', $event)"
    @dismiss="emit('dismiss', $event)"
    @after-open="emit('after-open')"
    @after-close="emit('after-close')"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <slot name="icon">
          <component
            :is="props.icon"
            v-if="props.icon"
            aria-hidden="true"
            :class="['size-5', resolvedIconClass]"
          />
          <TriangleAlert v-else aria-hidden="true" class="size-5" :class="resolvedIconClass" />
        </slot>
        <h2 class="text-xl font-bold text-fg">
          <slot name="title">{{ props.title }}</slot>
        </h2>
      </div>
    </template>

    <div class="flex flex-col gap-3">
      <p :id="questionId" class="text-sm text-fg">
        <slot name="question">{{ props.question }}</slot>
      </p>

      <slot />
      <slot name="list" />

      <div
        v-if="props.warning || $slots.warning"
        :id="warningId"
        class="flex items-center gap-1 text-danger"
      >
        <Info aria-hidden="true" class="size-3.5 shrink-0" />
        <p class="text-xs">
          <slot name="warning">{{ props.warning }}</slot>
        </p>
      </div>
    </div>

    <template #footer>
      <ButtonSecondary
        data-confirm-cancel
        :text="props.cancelText"
        class="min-w-24 px-2! text-base! before:scale-100!"
        @click="cancel"
      />
      <ButtonPrimary
        :text="props.confirmText"
        :loading="props.loading"
        :disabled="props.confirmDisabled"
        :danger="props.danger"
        :class="['min-w-24 text-base!', props.confirmClass]"
        @click="emit('confirm')"
      />
    </template>
  </Modal>
</template>
