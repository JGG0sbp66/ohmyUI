<!-- src/components/feedback/EmptyState.vue -->
<script setup lang="ts">
import { Inbox } from "@lucide/vue";

defineProps<{
  /** 空态说明；翻译和业务措辞由调用方负责 */
  text: string;
}>();

defineSlots<{
  icon?: () => unknown;
  action?: () => unknown;
}>();
</script>

<template>
  <div
    class="rounded-2xl border-2 border-dashed border-fg-subtle/10 bg-fg-subtle/2 px-4 py-10 text-center"
  >
    <div aria-hidden="true" class="mb-2 flex justify-center text-fg opacity-20">
      <slot name="icon">
        <Inbox aria-hidden="true" class="size-8" />
      </slot>
    </div>
    <p class="text-sm text-fg-muted/60">{{ text }}</p>
    <div v-if="$slots.action" class="mt-4 flex justify-center">
      <slot name="action" />
    </div>
  </div>
</template>
