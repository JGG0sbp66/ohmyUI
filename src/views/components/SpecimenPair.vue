<!-- src/views/components/SpecimenPair.vue -->
<!-- 预览用：浅深并置。两栏 markup 相同，深色栏靠 .dark 类取另一套 token 值 -->
<script setup lang="ts">
defineSlots<{
  default(props: { tone: "light" | "dark" }): unknown;
}>();

const MODES = [
  { label: ":root（浅色）", scope: "", tone: "light" as const },
  { label: ".dark（深色）", scope: "dark", tone: "dark" as const },
];
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <article
      v-for="mode in MODES"
      :key="mode.tone"
      class="rounded-xl bg-bg-card p-5 ring-1 ring-zinc-900/10 dark:ring-white/10"
      :class="mode.scope"
    >
      <h3 class="font-mono text-xs text-fg-muted">{{ mode.label }}</h3>
      <slot :tone="mode.tone"></slot>
    </article>
  </div>
</template>
