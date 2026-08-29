<!-- src/components/overlay/dropdown/DropdownMenuGroup.vue -->
<script setup lang="ts">
import { useId } from "vue";

const props = withDefaults(
  defineProps<{
    label?: string;
  }>(),
  { label: undefined },
);

const labelId = `ohmyui-dropdown-group-${useId()}`;
</script>

<template>
  <div role="group" :aria-labelledby="props.label ? labelId : undefined">
    <div v-if="props.label" :id="labelId" class="px-3 py-1 text-xs text-fg-muted">
      {{ props.label }}
    </div>
    <div class="flex flex-col gap-1">
      <slot />
    </div>
  </div>
</template>
