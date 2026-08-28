<!-- src/views/components/ModeControl.vue -->
<!-- 预览用：选择展示环境的确定性主题，不负责持久化 -->
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useId } from "vue";

import { useThemeStore, type ThemeMode } from "@/stores/theme.store";

const MODE_META = {
  light: { label: "浅色", icon: "sun" },
  dark: { label: "深色", icon: "moon" },
} as const satisfies Record<ThemeMode, { label: string; icon: "sun" | "moon" }>;

const themeStore = useThemeStore();
const { mode } = storeToRefs(themeStore);
const modes = themeStore.modes;
const groupName = `theme-mode-${useId()}`;
</script>

<template>
  <fieldset>
    <legend class="mb-2 font-mono text-[0.6875rem] tracking-[0.18em] text-fg-muted uppercase">
      显示模式
    </legend>

    <div class="mode-control__options">
      <label v-for="candidate in modes" :key="candidate" class="mode-control__option">
        <input
          v-model="mode"
          class="mode-control__input sr-only"
          type="radio"
          :name="groupName"
          :value="candidate"
        />

        <span class="mode-control__surface">
          <svg
            v-if="MODE_META[candidate].icon === 'sun'"
            class="size-4"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="3.25" />
            <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M16 4l-1.4 1.4M5.4 14.6 4 16" />
          </svg>

          <svg
            v-else
            class="size-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M16.5 12.1A6.75 6.75 0 0 1 7.9 3.5a6.75 6.75 0 1 0 8.6 8.6Z" />
          </svg>

          <span class="font-mono text-xs">{{ MODE_META[candidate].label }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.mode-control__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(4.5rem, 1fr));
  overflow: hidden;
  border: 1px solid var(--theme-border);
  border-radius: 0.625rem;
  background: var(--theme-bg-card);
}

.mode-control__option {
  position: relative;
  cursor: pointer;
}

.mode-control__option + .mode-control__option {
  border-left: 1px solid var(--theme-border);
}

.mode-control__surface {
  position: relative;
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding-inline: 0.75rem;
  color: var(--theme-fg-muted);
  background: transparent;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.mode-control__surface::after {
  position: absolute;
  right: 0.75rem;
  bottom: 0;
  left: 0.75rem;
  height: 2px;
  background: var(--theme-accent);
  content: "";
  opacity: 0;
  transform: scaleX(0.25);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.mode-control__input:checked + .mode-control__surface {
  color: var(--theme-fg);
  background: var(--theme-bg-muted);
}

.mode-control__input:checked + .mode-control__surface::after {
  opacity: 1;
  transform: scaleX(1);
}

.mode-control__input:focus-visible + .mode-control__surface {
  outline: 2px solid var(--theme-fg);
  outline-offset: -3px;
}

@media (hover: hover) {
  .mode-control__option:hover .mode-control__surface {
    color: var(--theme-fg);
    background: var(--theme-bg-muted);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mode-control__surface,
  .mode-control__surface::after {
    transition: none;
  }
}
</style>
