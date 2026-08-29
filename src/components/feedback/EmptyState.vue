<!-- src/components/feedback/EmptyState.vue -->
<script setup lang="ts">
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
        <svg
          class="size-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <path
            d="m5.45 5.11-3.4 6.8A2 2 0 0 0 2 12.8V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.2a2 2 0 0 0-.05-.89l-3.4-6.8A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"
          />
        </svg>
      </slot>
    </div>
    <p class="text-sm text-fg-muted/60">{{ text }}</p>
    <div v-if="$slots.action" class="mt-4 flex justify-center">
      <slot name="action" />
    </div>
  </div>
</template>
