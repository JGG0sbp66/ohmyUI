<!-- src/components/overlay/dialog/ConfirmDialog.vue -->
<script setup lang="ts">
import { computed, useId, useSlots } from "vue";
import type { Component, HTMLAttributes } from "vue";

import ButtonPrimary from "../../button/ButtonPrimary.vue";
import ButtonSecondary from "../../button/ButtonSecondary.vue";
import type { DialogDismissReason } from "./internal/dialog.types";
import Modal from "./Modal.vue";

defineOptions({ inheritAttrs: false });

interface Props {
  modelValue: boolean;
  icon?: Component;
  title: string;
  question: string;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  /** 使用危险色确认按钮，并在未指定 iconClass 时同步图标颜色。 */
  danger?: boolean;
  iconClass?: HTMLAttributes["class"];
  confirmClass?: HTMLAttributes["class"];
  panelClass?: HTMLAttributes["class"];
  loading?: boolean;
  confirmDisabled?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  lockScroll?: boolean;
  returnFocus?: boolean;
  teleportTo?: string | HTMLElement;
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  warning: undefined,
  confirmText: "确认",
  cancelText: "取消",
  danger: false,
  iconClass: undefined,
  confirmClass: undefined,
  panelClass: undefined,
  loading: false,
  confirmDisabled: false,
  closeOnBackdrop: true,
  closeOnEscape: true,
  lockScroll: true,
  returnFocus: true,
  teleportTo: "body",
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  cancel: [];
  dismiss: [reason: DialogDismissReason];
  "after-open": [];
  "after-close": [];
}>();

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
          <svg
            v-else
            class="size-5"
            :class="resolvedIconClass"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21.73 18 13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
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
        <svg
          class="size-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
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
