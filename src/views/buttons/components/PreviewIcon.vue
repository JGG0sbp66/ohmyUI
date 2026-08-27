<!-- src/views/buttons/components/PreviewIcon.vue -->
<!-- 预览用：占位图标，免得每处示例都抄一遍 svg 样板 -->
<script setup lang="ts">
defineProps<{ d: string }>();
</script>

<template>
  <svg
    class="size-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    aria-hidden="true"
  >
    <path :d="d" stroke-linecap="round" />
  </svg>
</template>
