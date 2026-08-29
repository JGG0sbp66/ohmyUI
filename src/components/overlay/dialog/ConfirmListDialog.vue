<!-- src/components/overlay/dialog/ConfirmListDialog.vue -->
<script setup lang="ts">
import type { Component, HTMLAttributes } from "vue";

import type { TagTone } from "../../tag/tag.types";
import Tag from "../../tag/Tag.vue";
import ConfirmDialog from "./ConfirmDialog.vue";
import type { DialogDismissReason } from "./internal/dialog.types";

interface ConfirmListItem {
  key: string | number;
  label: string;
  tag?: string;
  tagTone?: TagTone;
  tagClass?: HTMLAttributes["class"];
}

interface Props {
  modelValue: boolean;
  icon?: Component;
  title: string;
  question: string;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
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
  items: readonly ConfirmListItem[];
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

defineSlots<{
  default?(): unknown;
  item?(props: { item: ConfirmListItem; index: number }): unknown;
}>();
</script>

<template>
  <ConfirmDialog
    :model-value="props.modelValue"
    :icon="props.icon"
    :title="props.title"
    :question="props.question"
    :warning="props.warning"
    :confirm-text="props.confirmText"
    :cancel-text="props.cancelText"
    :danger="props.danger"
    :icon-class="props.iconClass"
    :confirm-class="props.confirmClass"
    :panel-class="props.panelClass"
    :loading="props.loading"
    :confirm-disabled="props.confirmDisabled"
    :close-on-backdrop="props.closeOnBackdrop"
    :close-on-escape="props.closeOnEscape"
    :lock-scroll="props.lockScroll"
    :return-focus="props.returnFocus"
    :teleport-to="props.teleportTo"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="emit('confirm')"
    @cancel="emit('cancel')"
    @dismiss="emit('dismiss', $event)"
    @after-open="emit('after-open')"
    @after-close="emit('after-close')"
  >
    <slot />

    <template #list>
      <div class="-mx-6 my-2 border-y border-border/40">
        <ul class="max-h-52 divide-y divide-border/20 overflow-y-auto">
          <template v-for="(item, index) in props.items" :key="item.key">
            <slot name="item" :item="item" :index="index">
              <li class="flex items-center gap-4 px-6 py-3">
                <span class="w-8 shrink-0 text-right font-mono text-[10px] text-fg-subtle">
                  {{ (index + 1).toString().padStart(2, "0") }} /
                </span>
                <span class="flex-1 truncate text-sm font-medium text-fg">
                  {{ item.label }}
                </span>
                <div class="flex shrink-0 items-center gap-1.5">
                  <Tag v-if="item.tag" :tone="item.tagTone" size="sm" :class="item.tagClass">
                    {{ item.tag }}
                  </Tag>
                </div>
              </li>
            </slot>
          </template>
        </ul>
      </div>
    </template>
  </ConfirmDialog>
</template>
