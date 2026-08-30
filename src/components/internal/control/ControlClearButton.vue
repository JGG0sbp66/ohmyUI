<script setup lang="ts">
import { X } from "@lucide/vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{ clear: [] }>();

defineSlots<{ default?(): unknown }>();
</script>

<template>
  <button
    v-bind="$attrs"
    type="button"
    :disabled="props.disabled"
    :title="props.label"
    :aria-label="props.label"
    class="shrink-0 rounded-md p-1 text-fg-soft transition-colors enabled:cursor-pointer enabled:hover:text-fg-subtle disabled:cursor-not-allowed motion-reduce:transition-none"
    @mousedown.prevent
    @click="emit('clear')"
  >
    <slot><X aria-hidden="true" class="size-4" /></slot>
  </button>
</template>
