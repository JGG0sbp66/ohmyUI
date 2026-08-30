<!-- src/views/components/ModeControl.vue -->
<!-- 预览用：选择展示环境的确定性主题，不负责持久化 -->
<script setup lang="ts">
import { storeToRefs } from "pinia";

import type { SegmentedControlOption } from "@/components/control/control.types";
import SegmentedControl from "@/components/control/SegmentedControl.vue";
import { useThemeRuntime, useThemeStore, type ThemeMode } from "@/theme";

import ModeMoonIcon from "./ModeMoonIcon.vue";
import ModeSunIcon from "./ModeSunIcon.vue";

const MODE_META = {
  light: { label: "浅色", icon: ModeSunIcon, iconClass: "size-4" },
  dark: { label: "深色", icon: ModeMoonIcon, iconClass: "size-4" },
} as const satisfies Record<ThemeMode, Omit<SegmentedControlOption<ThemeMode>, "value">>;

const themeStore = useThemeStore();
const themeRuntime = useThemeRuntime();
const { mode } = storeToRefs(themeStore);

const modeOptions = themeStore.modes.map((value) => ({
  value,
  ...MODE_META[value],
})) satisfies readonly SegmentedControlOption<ThemeMode>[];

function selectMode(nextMode: ThemeMode): void {
  void themeRuntime.setMode(nextMode);
}
</script>

<template>
  <div>
    <p class="mb-2 font-mono text-[0.6875rem] tracking-[0.18em] text-fg-muted uppercase">
      显示模式
    </p>

    <SegmentedControl
      :model-value="mode"
      :options="modeOptions"
      label="显示模式"
      class="min-w-36"
      @update:model-value="selectMode"
    />
  </div>
</template>
