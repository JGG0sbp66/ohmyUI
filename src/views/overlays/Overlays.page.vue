<!-- src/views/overlays/Overlays.page.vue -->
<script setup lang="ts">
import ButtonSecondary from "@/components/button/ButtonSecondary.vue";
import HelpTooltip from "@/components/overlay/HelpTooltip.vue";
import Tooltip from "@/components/overlay/Tooltip.vue";

import SpecimenPair from "../components/SpecimenPair.vue";

const TOOLTIP_API = [
  ["content", "string", "必填", "纯文本提示；default slot 可覆盖呈现"],
  ["placement", '"top" | "bottom"', '"top"', "首选方向；空间不足时自动翻转"],
  ["offset", "number", "8", "触发器与箭头尖端的距离（px）"],
  ["openDelay", "number", "250", "细指针 hover 的显示延迟（ms）"],
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
    <p class="max-w-xl text-sm/6 text-fg-muted">
      Overlay 是浮在页面内容之上的组件分类，不是单个组件。Tooltip 负责非交互式短说明；HelpTooltip
      是固定使用问号按钮的组合。两者都会 Teleport 到 body，避免被 overflow
      裁切，同时保留触发器所在的浅色或深色主题。
    </p>

    <section class="mt-10">
      <h2 class="font-mono text-sm text-fg">Tooltip</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-fg-muted">
        通用提示浮层。调用方拥有触发器，只需把
        <code class="font-mono text-fg">trigger</code>
        slot 下发的
        <code class="font-mono text-fg">attrs</code>
        完整绑定到真实可聚焦元素。鼠标悬停与键盘聚焦都能显示，Escape 可关闭。
      </p>

      <SpecimenPair class="mt-6">
        <p class="mt-4 font-mono text-xs text-fg-subtle">方向与状态</p>
        <div class="mt-2 flex flex-wrap items-center gap-2">
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

        <p class="mt-5 font-mono text-xs text-fg-subtle">定位行为</p>
        <p class="mt-2 text-xs/5 text-fg-muted">
          提示会跟随滚动、窗口缩放和触发器尺寸变化重新定位；靠近左右边缘时限制在视口内，靠近上下边缘时自动翻转。
        </p>
      </SpecimenPair>

      <div class="mt-6 overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left font-mono text-xs">
          <caption class="sr-only">
            Tooltip Props Slots and Events
          </caption>
          <thead>
            <tr class="text-fg-muted">
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">
                prop / slot / event
              </th>
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">类型</th>
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">默认</th>
              <th scope="col" class="border-b border-border/60 py-2 font-normal">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in TOOLTIP_API" :key="row[0]" class="text-fg-muted">
              <td class="border-b border-border/40 py-2.5 pr-4 text-fg">{{ row[0] }}</td>
              <td class="border-b border-border/40 py-2.5 pr-4">{{ row[1] }}</td>
              <td class="border-b border-border/40 py-2.5 pr-4">{{ row[2] }}</td>
              <td class="border-b border-border/40 py-2.5">{{ row[3] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mt-16">
      <h2 class="font-mono text-sm text-fg">HelpTooltip</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-fg-muted">
        面向字段标题和设置项的便捷组合：内部使用 ButtonIcon 作为问号触发器，并在 Tooltip 的
        hover、focus 基础上开启点击切换，因此触屏也能读取。它不属于 InputField，字段通过
        <code class="font-mono text-fg">hint</code>
        slot 自由组合。
      </p>

      <SpecimenPair class="mt-6">
        <p class="mt-4 font-mono text-xs text-fg-subtle">帮助入口</p>
        <div class="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
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

        <p class="mt-5 font-mono text-xs text-fg-subtle">操作方式</p>
        <p class="mt-2 text-xs/5 text-fg-muted">
          鼠标可悬停，键盘可 Tab 聚焦并按 Escape
          关闭；触屏或鼠标点击会固定提示，再次点击或点击外部关闭。
        </p>
      </SpecimenPair>

      <div class="mt-6 overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left font-mono text-xs">
          <caption class="sr-only">
            HelpTooltip Props and Slots
          </caption>
          <thead>
            <tr class="text-fg-muted">
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">
                prop / slot
              </th>
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">类型</th>
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">默认</th>
              <th scope="col" class="border-b border-border/60 py-2 font-normal">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in HELP_TOOLTIP_API" :key="row[0]" class="text-fg-muted">
              <td class="border-b border-border/40 py-2.5 pr-4 text-fg">{{ row[0] }}</td>
              <td class="border-b border-border/40 py-2.5 pr-4">{{ row[1] }}</td>
              <td class="border-b border-border/40 py-2.5 pr-4">{{ row[2] }}</td>
              <td class="border-b border-border/40 py-2.5">{{ row[3] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
