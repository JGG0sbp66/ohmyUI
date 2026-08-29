<!-- src/views/overlays/Overlays.page.vue -->
<script setup lang="ts">
import ButtonSecondary from "@/components/button/ButtonSecondary.vue";
import HelpTooltip from "@/components/overlay/tooltip/HelpTooltip.vue";
import Tooltip from "@/components/overlay/tooltip/Tooltip.vue";

import ApiTable from "../components/ApiTable.vue";
import ComponentDocsSection from "../components/ComponentDocsSection.vue";
import SpecimenCase from "../components/SpecimenCase.vue";
import SpecimenPair from "../components/SpecimenPair.vue";
import BottomSheetShowcase from "./components/BottomSheetShowcase.vue";
import DialogsShowcase from "./components/DialogsShowcase.vue";
import DropdownMenuShowcase from "./components/DropdownMenuShowcase.vue";
import PopoverShowcase from "./components/PopoverShowcase.vue";

const TOOLTIP_API = [
  ["content", "string", "必填", "纯文本提示；default slot 可覆盖呈现"],
  ["placement", '"top" | "bottom"', '"top"', "首选方向；空间不足时自动翻转"],
  ["offset", "number", "8", "触发器与箭头尖端的距离（px）"],
  ["openDelay", "number", "0", "默认立即显示；需要时可设置 hover 延迟（ms）"],
  ["closeDelay", "number", "80", "细指针离开后的关闭延迟（ms）"],
  ["openOnClick", "boolean", "false", "允许点击固定，再次点击或点外部关闭"],
  ["disabled", "boolean", "false", "关闭所有提示交互与 ARIA 关联"],
  ["contentClass", "HTMLAttributes['class']", "未传", "调整提示内容卡片"],
  ["#trigger", "{ attrs, open }", "必填", "将 attrs 绑定到真实可聚焦触发器"],
  ["#default", "slot", "content", "覆盖提示内容的呈现"],
  ["@open-change", "(open: boolean) => void", "—", "显示状态变化时触发"],
] as const;

const HELP_TOOLTIP_API = [
  ["content", "string", "必填", "问号按钮对应的帮助文本"],
  ["label", "string", '"查看说明"', "问号按钮的无障碍名称"],
  ["placement", '"top" | "bottom"', '"top"', "首选显示方向"],
  ["disabled", "boolean", "false", "禁用问号按钮与提示"],
  ["class / style", "透传", "未传", "作用于问号按钮"],
  ["contentClass", "HTMLAttributes['class']", "未传", "调整提示内容卡片"],
  ["#icon", "slot", "问号图标", "覆盖默认帮助图标"],
] as const;
</script>

<template>
  <div>
    <p class="max-w-2xl text-sm/6 text-fg-muted">
      Overlay 按交互层级分为三组：Tooltip 提供短说明，Popover 与 DropdownMenu
      依附触发器承载可交互内容，Dialog 与 BottomSheet 负责模态任务。它们通过 Teleport 避免被
      overflow 裁切，并共享触发位置主题、顶层关闭仲裁与焦点规则。
    </p>

    <ComponentDocsSection title="Tooltip" class="mt-10">
      <template #description>
        通用提示浮层。调用方拥有触发器，只需把
        <code class="font-mono text-fg">trigger</code>
        slot 下发的
        <code class="font-mono text-fg">attrs</code>
        完整绑定到真实可聚焦元素。鼠标悬停与键盘聚焦都能显示，Escape 可关闭。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="方向与状态" class="mt-4">
          <div class="flex flex-wrap items-center gap-2">
            <Tooltip content="默认从触发器上方出现，空间不足时会自动翻转。">
              <template #trigger="{ attrs, open }">
                <ButtonSecondary v-bind="attrs" text="上方提示" :is-active="open" />
              </template>
            </Tooltip>

            <Tooltip content="placement 只是首选方向，视口碰撞仍由组件处理。" placement="bottom">
              <template #trigger="{ attrs, open }">
                <ButtonSecondary v-bind="attrs" text="下方提示" :is-active="open" />
              </template>
            </Tooltip>

            <Tooltip content="禁用状态不会显示" disabled>
              <template #trigger="{ attrs }">
                <ButtonSecondary v-bind="attrs" text="禁用提示" disabled />
              </template>
            </Tooltip>
          </div>
        </SpecimenCase>

        <SpecimenCase label="定位行为" class="mt-5">
          <p class="text-xs/5 text-fg-muted">
            提示会跟随滚动、窗口缩放和触发器尺寸变化重新定位；靠近左右边缘时限制在视口内，靠近上下边缘时自动翻转。
          </p>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="Tooltip Props Slots and Events" :rows="TOOLTIP_API" />
    </ComponentDocsSection>

    <ComponentDocsSection title="HelpTooltip" class="mt-16">
      <template #description>
        面向字段标题和设置项的便捷组合：内部使用 ButtonIcon 作为问号触发器，并在 Tooltip 的
        hover、focus 基础上开启点击切换，因此触屏也能读取。它不属于 InputField，字段通过
        <code class="font-mono text-fg">hint</code>
        slot 自由组合。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="帮助入口" class="mt-4">
          <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span class="inline-flex items-center gap-1.5 text-sm font-medium text-fg">
              永久连接
              <HelpTooltip
                label="查看永久连接说明"
                content="将根据标题自动填写，你也可以手动修改；发布前不能为空。"
              />
            </span>

            <span class="inline-flex items-center gap-1.5 text-sm font-medium text-fg">
              下方显示
              <HelpTooltip
                label="查看下方提示"
                content="也可以将下方作为首选方向。"
                placement="bottom"
              />
            </span>

            <span class="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted">
              不可用
              <HelpTooltip content="禁用状态不会显示" disabled />
            </span>
          </div>
        </SpecimenCase>

        <SpecimenCase label="操作方式" class="mt-5">
          <p class="text-xs/5 text-fg-muted">
            鼠标可悬停，键盘可 Tab 聚焦并按 Escape
            关闭；触屏或鼠标点击会固定提示，再次点击或点击外部关闭。
          </p>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="HelpTooltip Props and Slots" :rows="HELP_TOOLTIP_API" />
    </ComponentDocsSection>

    <PopoverShowcase />
    <DropdownMenuShowcase />
    <DialogsShowcase />
    <BottomSheetShowcase />
  </div>
</template>
