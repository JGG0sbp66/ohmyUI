<!-- src/views/components/ComponentDocsSection.vue -->
<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps<{
  title: string;
}>();

defineSlots<{
  description(): unknown;
  default(): unknown;
}>();
</script>

<template>
  <section v-bind="$attrs">
    <h2 class="font-mono text-sm text-fg">{{ title }}</h2>
    <div class="mt-2 max-w-xl text-sm/6 text-fg-muted">
      <slot name="description" />
    </div>
    <slot />
  </section>
</template>
