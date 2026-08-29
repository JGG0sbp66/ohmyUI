<!-- src/components/overlay/dialog/ConfirmListDialog.vue -->
<script setup lang="ts">
import { computed } from "vue";

import Tag from "../../tag/Tag.vue";
import type {
  ConfirmDialogEmits,
  ConfirmDialogProps,
  ConfirmListDialogProps,
  ConfirmListItem,
} from "./confirm.types";
import ConfirmDialog from "./ConfirmDialog.vue";
import { CONFIRM_DIALOG_DEFAULTS } from "./internal/confirm.defaults";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ConfirmListDialogProps>(), CONFIRM_DIALOG_DEFAULTS);

const emit = defineEmits<ConfirmDialogEmits>();

const forwardedConfirmProps = computed<ConfirmDialogProps>(() => ({
  modelValue: props.modelValue,
  icon: props.icon,
  title: props.title,
  question: props.question,
  warning: props.warning,
  confirmText: props.confirmText,
  cancelText: props.cancelText,
  danger: props.danger,
  iconClass: props.iconClass,
  confirmClass: props.confirmClass,
  panelClass: props.panelClass,
  loading: props.loading,
  confirmDisabled: props.confirmDisabled,
  closeOnBackdrop: props.closeOnBackdrop,
  closeOnEscape: props.closeOnEscape,
  lockScroll: props.lockScroll,
  returnFocus: props.returnFocus,
  teleportTo: props.teleportTo,
}));

defineSlots<{
  default?(): unknown;
  item?(props: { item: ConfirmListItem; index: number }): unknown;
}>();
</script>

<template>
  <ConfirmDialog
    v-bind="{ ...$attrs, ...forwardedConfirmProps }"
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
