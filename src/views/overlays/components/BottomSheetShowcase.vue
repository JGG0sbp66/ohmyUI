<!-- src/views/overlays/components/BottomSheetShowcase.vue -->
<script setup lang="ts">
import { ref } from "vue";

import ButtonPrimary from "@/components/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/button/ButtonSecondary.vue";
import BottomSheet from "@/components/overlay/bottom-sheet/BottomSheet.vue";

import ApiTable from "../../components/ApiTable.vue";
import ComponentDocsSection from "../../components/ComponentDocsSection.vue";
import SpecimenCase from "../../components/SpecimenCase.vue";
import SpecimenPair from "../../components/SpecimenPair.vue";

type Tone = "light" | "dark";
type SheetKind = "short" | "long";

interface OpenSheet {
  tone: Tone;
  kind: SheetKind;
}

const openSheet = ref<OpenSheet | null>(null);
const LONG_ITEMS = [
  "统一浮层定位策略",
  "完善键盘焦点顺序",
  "迁移文章操作菜单",
  "校验局部主题继承",
  "补齐移动端安全区域",
  "处理滚动锁与背景隔离",
  "验证快速关闭与重开",
  "整理公开 Props 与 Slots",
  "核对浅色与深色样本",
  "运行类型和 Lint 检查",
  "完成生产构建验证",
] as const;

const BOTTOM_SHEET_API = [
  ["modelValue / v-model", "boolean", "必填", "控制显示；所有关闭请求均返回父组件"],
  ["title / description", "string", "未传", "内置标题区与说明"],
  ["closeLabel", "string", '"Close"', "内置图标关闭按钮的无障碍名称"],
  ["role / aria-*", "ARIA attributes", '"dialog"', "无标题或 header 时必须提供可访问名称"],
  ["closeOnBackdrop / closeOnEscape", "boolean", "true / true", "仅最上层模态响应关闭"],
  ["lockScroll / returnFocus", "boolean", "true / true", "页面滚动锁和关闭后的焦点归还"],
  ["initialFocus", "CSS selector", "关闭按钮 / 面板", "指定面板内初始焦点"],
  ["teleportTo", "string | HTMLElement", '"body"', "挂载目标；打开到离场结束保持冻结"],
  ["draggable", "boolean", "true", "是否显示把手并启用收起 / 展开 / 拖动关闭"],
  ["panelClass / panelStyle", "透传", "未传", "调整视觉面板；motion transform 位于独立外壳"],
  ["#header", "{ close, expanded, titleId, descriptionId }", "内置", "自定义标题时保留命名关联"],
  ["#default / #footer", "{ close, expanded }", "按需", "滚动内容与固定底部操作区"],
  ["@dismiss", '"backdrop" | "escape" | "close" | "drag"', "—", "报告关闭来源"],
  ["@expanded-change", "(expanded: boolean) => void", "—", "拖拽 snap 状态变化"],
  ["@after-open / @after-close", "event", "—", "进场或离场完成"],
] as const;
</script>

<template>
  <ComponentDocsSection title="BottomSheet" class="mt-16">
    <template #description>
      移动端底部模态层。收起时保持内容自然高度且不超过 72dvh，上拉可展开到 92dvh；它与 Dialog
      共用焦点、滚动锁、背景隔离和嵌套层级，但手势由独立状态机维护。
    </template>

    <SpecimenPair v-slot="{ tone }" class="mt-6">
      <SpecimenCase label="内容规模" class="mt-4">
        <div class="flex flex-wrap items-center gap-2">
          <ButtonSecondary text="打开短内容" @click="openSheet = { tone, kind: 'short' }" />
          <ButtonSecondary text="打开可拖拽长内容" @click="openSheet = { tone, kind: 'long' }" />
        </div>

        <BottomSheet
          :model-value="openSheet?.tone === tone && openSheet.kind === 'short'"
          title="快速设置"
          description="短内容保持自然高度。"
          close-label="关闭快速设置"
          :draggable="false"
          @update:model-value="openSheet = $event ? { tone, kind: 'short' } : null"
        >
          <div class="space-y-2 pb-2 text-sm/6 text-fg">
            <p>这里适合少量选择、确认信息或移动端快捷操作。</p>
            <p class="text-fg-muted">点击遮罩、按 Escape 或使用下方按钮均可关闭。</p>
          </div>

          <template #footer="{ close }">
            <div class="flex justify-end border-t border-border/30 pt-3">
              <ButtonPrimary text="完成" class="min-w-24" @click="close" />
            </div>
          </template>
        </BottomSheet>

        <BottomSheet
          :model-value="openSheet?.tone === tone && openSheet.kind === 'long'"
          title="迁移检查清单"
          description="拖动顶部把手体验收起、展开与关闭。"
          close-label="关闭迁移检查清单"
          @update:model-value="openSheet = $event ? { tone, kind: 'long' } : null"
        >
          <template #default="{ expanded }">
            <div class="pb-2">
              <div
                class="sticky top-0 z-10 mb-2 flex items-center justify-between border-b border-border/30 bg-bg-card py-2 text-xs"
              >
                <span class="text-fg-muted">当前状态</span>
                <span class="font-medium text-fg">{{ expanded ? "已展开" : "已收起" }}</span>
              </div>
              <ul class="divide-y divide-border/20">
                <li
                  v-for="(item, index) in LONG_ITEMS"
                  :key="item"
                  class="flex items-center gap-3 py-3"
                >
                  <span class="w-6 shrink-0 font-mono text-[10px] text-fg-muted">
                    {{ String(index + 1).padStart(2, "0") }}
                  </span>
                  <span class="text-sm text-fg">{{ item }}</span>
                </li>
              </ul>
            </div>
          </template>

          <template #footer="{ close, expanded }">
            <div class="flex items-center justify-between gap-3 border-t border-border/30 pt-3">
              <span class="text-xs text-fg-muted">
                {{ expanded ? "下拉把手可收起" : "上拉把手可展开" }}
              </span>
              <ButtonPrimary text="完成检查" class="shrink-0" @click="close" />
            </div>
          </template>
        </BottomSheet>
      </SpecimenCase>

      <SpecimenCase label="手势与键盘" class="mt-5">
        <p class="text-xs/5 text-fg-muted">
          收起态上拉进入展开，收起态下拉关闭；展开态第一次下拉只收起，避免一次手势穿透关闭。 Escape
          可关闭，Tab 始终限制在最上层面板内，长内容区可独立滚动。
        </p>
      </SpecimenCase>
    </SpecimenPair>

    <ApiTable caption="BottomSheet Props Slots and Events" :rows="BOTTOM_SHEET_API" />
  </ComponentDocsSection>
</template>
