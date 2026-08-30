<!-- src/views/overlays/components/DropdownMenuShowcase.vue -->
<script setup lang="ts">
import { ChevronDown } from "@lucide/vue";
import { reactive, ref } from "vue";

import ButtonSecondary from "@/components/button/ButtonSecondary.vue";
import DropdownMenu from "@/components/overlay/dropdown/DropdownMenu.vue";
import DropdownMenuGroup from "@/components/overlay/dropdown/DropdownMenuGroup.vue";
import DropdownMenuItem from "@/components/overlay/dropdown/DropdownMenuItem.vue";
import DropdownMenuSeparator from "@/components/overlay/dropdown/DropdownMenuSeparator.vue";

import ApiTable from "../../components/ApiTable.vue";
import ComponentDocsSection from "../../components/ComponentDocsSection.vue";
import SpecimenCase from "../../components/SpecimenCase.vue";
import SpecimenPair from "../../components/SpecimenPair.vue";

type Tone = "light" | "dark";

const menuTone = ref<Tone | null>(null);
const selection = reactive<Record<Tone, string>>({
  light: "尚未执行操作",
  dark: "尚未执行操作",
});

const DROPDOWN_API = [
  ["modelValue / v-model", "boolean", "false", "控制菜单显示"],
  ["label", "string", "必填", "menu 的无障碍名称"],
  ["placement / offset", "AnchoredPlacement / number", '"bottom-start" / 12', "定位偏好与间距"],
  ["collisionPadding", "number", "8", "菜单与视口边缘的最小距离"],
  ["interaction", '"click" | "hover" | "both"', '"click"', "触发方式；触屏始终保留点击"],
  ["openDelay / closeDelay", "number", "0 / 120", "hover 模式的开启与关闭延迟（ms）"],
  ["loop", "boolean", "true", "方向键到达首尾时是否循环"],
  ["disabled", "boolean", "false", "禁用触发与菜单"],
  ["contentClass / teleportTo", "透传", "未传 / body", "菜单外壳样式与挂载目标"],
  ["#trigger", "{ attrs, open }", "必填", "绑定到真实菜单按钮"],
  ["#default", "{ close }", "必填", "组合 MenuItem、Group 与 Separator"],
  [
    "MenuItem",
    "text + state props",
    "必填文字",
    "active、disabled、danger、closeOnSelect 与 icon / suffix",
  ],
  ["MenuGroup", "label?", "未传", "输出命名 role=group"],
  ["MenuSeparator", "—", "—", "语义分隔线"],
  ["@open-change / @select", "event", "—", "菜单状态变化 / 菜单项被选择"],
] as const;
</script>

<template>
  <ComponentDocsSection title="DropdownMenu" class="mt-16">
    <template #description>
      基于 Popover 的复合菜单，提供真实 menu / menuitem 语义、roving focus、方向键、Home / End
      与字符检索。分组、分隔线和菜单项状态保持为可组合子组件。
    </template>

    <SpecimenPair v-slot="{ tone }" class="mt-6">
      <SpecimenCase label="组合菜单" class="mt-4">
        <DropdownMenu
          :model-value="menuTone === tone"
          label="文章操作"
          content-class="w-60"
          @update:model-value="menuTone = $event ? tone : null"
        >
          <template #trigger="{ attrs, open }">
            <ButtonSecondary v-bind="attrs" text="文章操作" :is-active="open">
              <template #suffix>
                <ChevronDown aria-hidden="true" class="size-3.5" />
              </template>
            </ButtonSecondary>
          </template>

          <DropdownMenuGroup label="视图">
            <DropdownMenuItem text="预览文章" @select="selection[tone] = '已打开预览'">
              <template #icon><span class="size-2 rounded-full bg-accent" /></template>
              <template #suffix>
                <kbd class="font-mono text-[10px] text-fg-muted">P</kbd>
              </template>
            </DropdownMenuItem>
            <DropdownMenuItem text="编辑内容" active @select="selection[tone] = '已进入编辑'">
              <template #icon><span class="size-2 rounded-full bg-fg-muted" /></template>
              <template #suffix>
                <span class="text-[10px] text-fg-muted">当前</span>
              </template>
            </DropdownMenuItem>
            <DropdownMenuItem text="复制草稿" disabled>
              <template #icon><span class="size-2 rounded-full bg-fg-muted/40" /></template>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup label="管理">
            <DropdownMenuItem text="归档文章" @select="selection[tone] = '文章已归档'" />
            <DropdownMenuItem
              text="移至回收站"
              danger
              @select="selection[tone] = '文章已移至回收站'"
            />
          </DropdownMenuGroup>
        </DropdownMenu>

        <p class="mt-3 text-xs text-fg-muted" aria-live="polite">
          {{ selection[tone] }}
        </p>
      </SpecimenCase>

      <SpecimenCase label="键盘操作" class="mt-5">
        <p class="text-xs/5 text-fg-muted">
          ArrowDown / ArrowUp 从按钮打开并聚焦首项或末项；菜单内可用方向键、Home / End
          和字符检索。Escape 返回按钮，Tab / Shift+Tab 关闭后继续到相邻焦点，禁用项不会进入导航。
        </p>
      </SpecimenCase>
    </SpecimenPair>

    <ApiTable caption="DropdownMenu Compound API" :rows="DROPDOWN_API" />
  </ComponentDocsSection>
</template>
