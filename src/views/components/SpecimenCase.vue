<!-- src/views/components/SpecimenCase.vue -->
<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps<{
  label: string;
}>();

defineSlots<{
  default(): unknown;
}>();
</script>

<template>
  <section v-bind="$attrs">
    <h4 class="font-mono text-xs text-fg-subtle">{{ label }}</h4>
    <div class="mt-2">
      <slot />
    </div>
  </section>
</template>
