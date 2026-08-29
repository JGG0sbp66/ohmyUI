<!-- src/views/overlays/components/DialogsShowcase.vue -->
<script setup lang="ts">
import { ref } from "vue";

import ButtonPrimary from "@/components/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/button/ButtonSecondary.vue";
import ConfirmDialog from "@/components/overlay/dialog/ConfirmDialog.vue";
import ConfirmListDialog from "@/components/overlay/dialog/ConfirmListDialog.vue";
import Modal from "@/components/overlay/dialog/Modal.vue";

import ApiTable from "../../components/ApiTable.vue";
import ComponentDocsSection from "../../components/ComponentDocsSection.vue";
import SpecimenCase from "../../components/SpecimenCase.vue";
import SpecimenPair from "../../components/SpecimenPair.vue";

type Tone = "light" | "dark";

const modalTone = ref<Tone | null>(null);
const confirmTone = ref<Tone | null>(null);
const listTone = ref<Tone | null>(null);

const CONFIRM_ITEMS = [
  {
    key: "release",
    label: "组件发布说明",
    tag: "已发布",
    tagTone: "accent",
  },
  {
    key: "theme",
    label: "主题系统设计记录",
    tag: "草稿",
    tagTone: "neutral",
  },
  { key: "cleanup", label: "过期内容清理", tag: "待删除", tagTone: "danger" },
] as const;

const MODAL_API = [
  ["modelValue / v-model", "boolean", "必填", "控制显示；关闭请求通过 update:modelValue 返回"],
  ["size", '"sm" | "md" | "lg" | "xl" | "2xl"', '"md"', "稳定的最大宽度预设"],
  ["maxWidth", "string", "未传", "自定义 Tailwind 最大宽度类，优先于 size"],
  ["role", '"dialog" | "alertdialog"', '"dialog"', "弹窗的 ARIA 角色"],
  ["ariaLabel / ariaLabelledby", "string", "自动/未传", "无 header 时应提供可访问名称"],
  ["closeOnBackdrop", "boolean", "true", "主键按下遮罩时请求关闭"],
  ["closeOnEscape", "boolean", "true", "仅最上层 Dialog 响应 Escape"],
  ["lockScroll", "boolean", "true", "锁定页面滚动并补偿滚动条宽度"],
  ["returnFocus", "boolean", "true", "关闭动画结束后把焦点归还触发器"],
  ["initialFocus", "CSS selector", "首个可聚焦项", "指定面板内的初始焦点"],
  ["panelClass / panelStyle", "透传", "未传", "调整面板，不作用于遮罩"],
  ["#header / #default / #footer", "{ close }", "按需", "Modal 的三个结构化内容区"],
  ["@dismiss", '"backdrop" | "escape" | "close"', "—", "报告关闭来源"],
  ["@after-open / @after-close", "event", "—", "进场或离场动画完成"],
] as const;

const CONFIRM_API = [
  ["modelValue / v-model", "boolean", "必填", "控制显示"],
  ["title / question", "string", "必填", "标题和主要确认问题"],
  ["warning", "string", "未传", "危险说明，同时进入 aria-describedby"],
  ["confirmText / cancelText", "string", '"确认" / "取消"', "由产品层覆盖即可接入国际化"],
  ["danger", "boolean", "false", "确认按钮与默认图标使用危险色"],
  ["icon", "Component", "内置警告图标", "替换标题图标，不依赖第三方图标库"],
  ["loading / confirmDisabled", "boolean", "false", "确认操作状态"],
  ["#default / #list", "slot", "未传", "在问题和警告之间插入补充内容"],
  ["@confirm / @cancel", "event", "—", "确认不自动关闭；取消会请求关闭"],
] as const;

const CONFIRM_LIST_API = [
  [
    "items",
    "readonly ConfirmListItem[]",
    "必填",
    "key、label 与可选 tag / tagTone / tagClass；状态标签由通用 Tag 渲染",
  ],
  ["#item", "{ item, index }", "默认行", "替换整行呈现"],
  ["其余 props / events", "ConfirmDialog", "继承", "标题、危险态、loading 与关闭策略一致"],
] as const;
</script>

<template>
  <ComponentDocsSection title="Dialog / Modal" class="mt-16">
    <template #description>
      Dialog 管理 Teleport、遮罩、焦点、滚动与层级；Modal 在它上面提供 header、body、footer
      分区。面板采用统一的圆角、阴影与进退场时序。
    </template>

    <SpecimenPair class="mt-6" v-slot="{ tone }">
      <SpecimenCase label="局部主题" class="mt-4">
        <ButtonSecondary text="打开基础弹窗" @click="modalTone = tone" />

        <Modal
          :model-value="modalTone === tone"
          initial-focus="[data-modal-cancel]"
          @update:model-value="modalTone = $event ? tone : null"
        >
          <template #header>
            <h2 class="text-xl font-bold text-fg">基础弹窗</h2>
          </template>

          <p class="text-sm/6 text-fg">
            这个弹窗从 {{ tone === "light" ? "浅色" : "深色" }} 展示区触发，Teleport 到 body
            后仍保留触发器所在主题。
          </p>
          <template #footer="{ close }">
            <ButtonSecondary data-modal-cancel text="取消" class="min-w-24" @click="close" />
            <ButtonPrimary text="完成" class="min-w-24" @click="close" />
          </template>
        </Modal>
      </SpecimenCase>
    </SpecimenPair>

    <ApiTable caption="Dialog and Modal Props Slots and Events" :rows="MODAL_API" />
  </ComponentDocsSection>

  <ComponentDocsSection title="ConfirmDialog" class="mt-16">
    <template #description>
      通用确认组合。默认聚焦取消按钮；确认事件不擅自关闭，方便调用方等待异步操作完成。
    </template>

    <SpecimenPair class="mt-6" v-slot="{ tone }">
      <SpecimenCase label="危险操作" class="mt-4">
        <ButtonSecondary text="打开确认弹窗" @click="confirmTone = tone" />

        <ConfirmDialog
          :model-value="confirmTone === tone"
          title="删除这篇文章？"
          question="删除后文章将无法继续被访问。"
          warning="这个操作不可撤销。"
          confirm-text="确认删除"
          danger
          @update:model-value="confirmTone = $event ? tone : null"
          @confirm="confirmTone = null"
        />
      </SpecimenCase>
    </SpecimenPair>

    <ApiTable caption="ConfirmDialog Props Slots and Events" :rows="CONFIRM_API" />
  </ComponentDocsSection>

  <ComponentDocsSection title="ConfirmListDialog" class="mt-16">
    <template #description>
      批量操作的列表扩展。列表有固定最大高度和独立滚动，默认行使用紧凑状态标签，也可通过
      <code class="font-mono text-fg">#item</code> 替换整行。
    </template>

    <SpecimenPair class="mt-6" v-slot="{ tone }">
      <SpecimenCase label="批量确认" class="mt-4">
        <ButtonSecondary text="查看待处理条目" @click="listTone = tone" />

        <ConfirmListDialog
          :model-value="listTone === tone"
          title="批量删除文章？"
          question="以下 3 篇文章将被删除。"
          warning="这个操作不可撤销。"
          confirm-text="删除全部"
          :items="CONFIRM_ITEMS"
          danger
          @update:model-value="listTone = $event ? tone : null"
          @confirm="listTone = null"
        />
      </SpecimenCase>
    </SpecimenPair>

    <ApiTable caption="ConfirmListDialog Props Slots and Events" :rows="CONFIRM_LIST_API" />
  </ComponentDocsSection>
</template>
