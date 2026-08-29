<!-- src/views/overlays/components/PopoverShowcase.vue -->
<script setup lang="ts">
import { ref } from "vue";

import ButtonSecondary from "@/components/button/ButtonSecondary.vue";
import Popover from "@/components/overlay/popover/Popover.vue";

import ApiTable from "../../components/ApiTable.vue";
import ComponentDocsSection from "../../components/ComponentDocsSection.vue";
import SpecimenCase from "../../components/SpecimenCase.vue";
import SpecimenPair from "../../components/SpecimenPair.vue";

type Tone = "light" | "dark";
type DemoPlacement = "top" | "right" | "bottom" | "left";

interface OpenPopover {
  tone: Tone;
  placement: DemoPlacement;
}

const openPopover = ref<OpenPopover | null>(null);
const PLACEMENT_CASES = [
  { value: "top", label: "首选上方" },
  { value: "right", label: "首选右侧" },
  { value: "bottom", label: "首选下方" },
  { value: "left", label: "首选左侧" },
] as const;

const POPOVER_API = [
  ["modelValue / v-model", "boolean", "false", "控制显示状态"],
  ["placement", "AnchoredPlacement", '"bottom-start"', "四边及 start / center / end 对齐"],
  ["offset / collisionPadding", "number", "8 / 8", "锚点间距与视口碰撞边距（px）"],
  ["flip / shift", "boolean", "true / true", "空间不足时翻转，并将面板限制在视口内"],
  ["disabled", "boolean", "false", "阻止打开；启用期间切为 true 会关闭"],
  ["closeOnOutside / closeOnEscape", "boolean", "true / true", "最上层浮层的关闭策略"],
  ["autoFocus", "boolean", "true", "dialog 角色打开后聚焦面板内首个可聚焦项"],
  ["initialFocus", "CSS selector", "未传", "指定面板内初始焦点"],
  ["returnFocus", "boolean", "true", "Escape 或 close() 后将焦点归还触发器"],
  ["teleportTo", "string | HTMLElement", '"body"', "挂载目标；一次显示周期内保持冻结"],
  ["role / aria-*", "ARIA attributes", '"dialog"', "presentation 角色不会输出命名属性"],
  ["panelClass / panelStyle", "透传", "未传", "调整浮层面板；定位字段由组件保留"],
  ["#trigger", "{ attrs, open }", "必填", "attrs 必须绑定到真实可聚焦触发器"],
  ["#default", "{ close, placement }", "必填", "关闭方法与碰撞计算后的最终方向"],
  ["@dismiss", '"trigger" | "outside" | "escape" | "close"', "—", "报告关闭来源"],
  ["@open-change / @ready", "event", "—", "显示状态变化 / 已定位且可安全聚焦"],
] as const;
</script>

<template>
  <ComponentDocsSection title="Popover" class="mt-16">
    <template #description>
      可交互的锚定浮层。首选方向会根据视口空间自动 flip / shift；Teleport
      后仍继承触发位置的局部主题， 并与 Dialog、BottomSheet 共用顶层关闭仲裁。
    </template>

    <SpecimenPair v-slot="{ tone }" class="mt-6">
      <SpecimenCase label="四向定位" class="mt-4">
        <div class="flex flex-wrap items-center gap-2">
          <Popover
            v-for="item in PLACEMENT_CASES"
            :key="item.value"
            :model-value="openPopover?.tone === tone && openPopover.placement === item.value"
            :placement="item.value"
            :aria-label="`${item.label}弹出内容`"
            panel-class="w-64 p-4"
            @update:model-value="openPopover = $event ? { tone, placement: item.value } : null"
          >
            <template #trigger="{ attrs, open }">
              <ButtonSecondary v-bind="attrs" :text="item.label" :is-active="open" />
            </template>

            <template #default="{ close, placement }">
              <p class="text-sm font-semibold text-fg">最终方向：{{ placement }}</p>
              <p class="mt-1 text-xs/5 text-fg-muted">
                方向是偏好而不是硬约束；靠近视口边缘时会自动翻转或平移。
              </p>
              <ButtonSecondary class="mt-3" text="关闭浮层" @click="close" />
            </template>
          </Popover>
        </div>
      </SpecimenCase>

      <SpecimenCase label="焦点与关闭" class="mt-5">
        <p class="text-xs/5 text-fg-muted">
          Enter 或 Space 从触发器打开后，默认聚焦面板内首个控件；Escape 与面板 close()
          会关闭并回焦，点击外部则保留新的点击目标。嵌套在模态层中时一次操作只关闭最上层。
        </p>
      </SpecimenCase>
    </SpecimenPair>

    <ApiTable caption="Popover Props Slots and Events" :rows="POPOVER_API" />
  </ComponentDocsSection>
</template>
