<script setup lang="ts">
import ClearIcon from "../icon/ClearIcon.vue";

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
    class="shrink-0 rounded-md p-1 text-fg-soft transition-colors duration-150 outline-none enabled:cursor-pointer enabled:hover:text-fg-subtle enabled:focus-visible:ring-2 enabled:focus-visible:ring-accent/40 disabled:cursor-not-allowed motion-reduce:transition-none"
    @mousedown.prevent
    @click="emit('clear')"
  >
    <slot><ClearIcon class="size-4" /></slot>
  </button>
</template>
