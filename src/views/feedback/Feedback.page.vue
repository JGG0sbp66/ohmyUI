<!-- src/views/feedback/Feedback.page.vue -->
<script setup lang="ts">
import { Users } from "@lucide/vue";

import ButtonSecondary from "@/components/button/ButtonSecondary.vue";
import EmptyState from "@/components/feedback/EmptyState.vue";
import Loading from "@/components/feedback/Loading.vue";
import Progress from "@/components/feedback/Progress.vue";

import ApiTable from "../components/ApiTable.vue";
import ComponentDocsSection from "../components/ComponentDocsSection.vue";
import SpecimenCase from "../components/SpecimenCase.vue";
import SpecimenPair from "../components/SpecimenPair.vue";

const LOADING_API = [
  [
    "class / style / 原生 SVG 属性",
    "透传",
    "未传",
    "作用于根 SVG；尺寸取 1em，颜色取 currentColor",
  ],
  ["props / slots / events", "—", "—", "无；状态文案由调用方在外层提供"],
] as const;

const PROGRESS_API = [
  [
    "label",
    "string",
    "必填",
    "默认显示于说明行；内部 progressbar 通过 aria-labelledby 引用该可见标签，#label 内容会直接成为无障碍名称",
  ],
  [
    "value",
    "number",
    "0",
    "当前值；非有限值回退为归一化后的 min，再限制到 [min, max]",
  ],
  ["min", "number", "0", "最小值；非有限值回退为 0"],
  [
    "max",
    "number",
    "100",
    "最大值；非法时先尝试 min + 100；若仍不能形成有限递增范围，整个区间回退为 0..100",
  ],
  [
    "showValue",
    "boolean",
    "true",
    "控制右侧可见值；设为 false 不会移除 aria-valuetext 或其他进度语义",
  ],
  ["size", '"sm" | "md" | "lg"', '"md"', "轨道高度依次为 h-1 / h-2 / h-3"],
  [
    "indeterminate",
    "boolean",
    "false",
    "启用不确定状态；保留 min / max，省略 aria-valuenow",
  ],
  [
    "indeterminateText",
    "string",
    "未传",
    "不确定状态的默认右侧文案与 aria-valuetext；未传时不硬编码状态词",
  ],
  [
    "ariaValueText",
    "string",
    "未传",
    "显式 aria-valuetext，优先级最高；覆盖 #value 的省略规则及 formatValue / 默认百分比 / indeterminateText",
  ],
  [
    "animated",
    "boolean",
    "true",
    "确定态仅过渡 width 250ms；不确定态移动约 40% 的单段填充，false 或 reduced motion 下使用不表示完成比例的全宽静态纹理",
  ],
  [
    "formatValue",
    "(context) => string",
    "整数百分比",
    "无 #value 时格式化确定态的可见值与 aria-valuetext；context 含归一化后的 value / min / max / percentage / indeterminate",
  ],
  [
    "#label",
    "slot(context)",
    "label",
    "自定义可见标签和 progressbar 的无障碍名称；接收与 formatValue 相同的归一化 context",
  ],
  [
    "#value",
    "slot(context)",
    "格式化值",
    "自定义右侧可见内容；存在插槽但未传 ariaValueText 时省略 aria-valuetext，仍保留数值型 ARIA",
  ],
  [
    "class / style / 原生 div 属性",
    "透传",
    "未传",
    "作用于根 div；role 和 aria-value* 由内部轨道提供",
  ],
  [
    "内部轨道 ARIA",
    'role="progressbar"',
    "自动",
    "通过 aria-labelledby 引用可见标签；确定态提供 min / max / now，valuetext 按优先级提供；不确定态省略 now；无 aria-live，不可聚焦",
  ],
  ["events", "—", "—", "无"],
] as const;

const EMPTY_STATE_API = [
  ["text", "string", "必填", "空态说明；翻译和业务措辞由调用方负责"],
  ["class / style / 原生属性", "透传", "未传", "作用于根 div，可传 role / aria-live"],
  ["#icon", "slot", "内置 Inbox", "装饰图标；包装层固定 aria-hidden"],
  ["#action", "slot", "未传", "文案下方的下一步引导操作"],
  ["events", "—", "—", "无"],
] as const;

type ProgressRange = {
  readonly value: number;
  readonly max: number;
};

const formatStepValue = ({ value, max }: ProgressRange) => `第 ${value}/${max} 步`;
const formatStorageValue = ({ value, max }: ProgressRange) => `${value} / ${max} GB`;
</script>

<template>
  <div>
    <p class="max-w-xl text-sm/6 text-fg-muted">
      反馈组件只负责表达状态，不决定业务文案和后续动作。Loading 跟随排版上下文，Progress
      沿用博客步骤条的视觉层级，EmptyState 保留 ohmyblog 的虚线容器和低强调层级。
    </p>

    <ComponentDocsSection title="Loading" class="mt-10">
      <template #description>
        尺寸取 1em、颜色取 currentColor。图形本身是装饰性的；需要宣告加载状态时，由调用方提供 role
        和可读文本。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="尺寸与颜色" class="mt-4">
          <div class="flex items-center gap-5">
            <span class="text-sm text-fg"><Loading /></span>
            <span class="text-xl text-fg-subtle"><Loading /></span>
            <span class="text-3xl text-accent"><Loading /></span>
          </div>
        </SpecimenCase>

        <SpecimenCase label="可访问的状态包装" class="mt-5">
          <div role="status" class="inline-flex items-center gap-2 text-sm text-fg-muted">
            <Loading />
            <span>正在加载文章</span>
          </div>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="Loading API" :rows="LOADING_API" />
    </ComponentDocsSection>

    <ComponentDocsSection title="Progress" class="mt-16">
      <template #description>
        <p>
          必填 label 是可见标签的 fallback；内部进度条通过 aria-labelledby
          引用实际可见标签，因此 #label 内容也会直接成为无障碍名称。
        </p>
        <p class="mt-2">
          min 非有限时回退为 0；max 非有限或不大于 min 时先尝试 min + 100；如果 min + 100
          仍无法形成有限递增范围，则整个区间回退为 0–100。value
          非有限时回退为 min，并限制在有效区间内。宽度、格式化文案和 ARIA
          共用这组归一化结果；极端跨度溢出时按 min / max / value
          的最大绝对值稳定缩放后计算，最终百分比限制在 0–100。
        </p>
        <p class="mt-2">
          确定态提供 aria-valuemin / max / now，不确定态省略 aria-valuenow。ariaValueText
          是 aria-valuetext 的最高优先级覆盖；未提供时，无 #value 会使用 formatValue / 默认百分比或
          indeterminateText，有 #value 则省略 aria-valuetext、保留数值型 ARIA。showValue
          始终只影响视觉。
        </p>
        <p class="mt-2">
          animated=true 时不确定态以约 40% 的单段填充横向移动；animated=false 或 reduced motion
          下改为全宽静态纹理，表达未知进度而非具体完成比例。
        </p>
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="博客步骤格式" class="mt-4">
          <Progress
            label="配置双重验证"
            :value="2"
            :max="5"
            :format-value="formatStepValue"
          />
        </SpecimenCase>

        <SpecimenCase label="常规百分比" class="mt-5">
          <Progress label="文章导入" :value="68" />
        </SpecimenCase>

        <SpecimenCase label="边界与完成状态" class="mt-5">
          <div class="space-y-5">
            <Progress label="尚未开始" :value="0" />
            <Progress label="已完成" :value="100" />
          </div>
        </SpecimenCase>

        <SpecimenCase label="三种尺寸" class="mt-5">
          <div class="space-y-5">
            <Progress label="小尺寸" :value="35" size="sm" />
            <Progress label="中尺寸" :value="55" size="md" />
            <Progress label="大尺寸" :value="75" size="lg" />
          </div>
        </SpecimenCase>

        <SpecimenCase label="不确定状态" class="mt-5">
          <div class="space-y-5">
            <Progress label="同步文章" indeterminate indeterminate-text="同步中" />
            <Progress label="准备预览" indeterminate />
          </div>
        </SpecimenCase>

        <SpecimenCase label="格式化与作用域插槽" class="mt-5">
          <Progress
            label="媒体存储"
            :value="32"
            :max="128"
            :format-value="formatStorageValue"
            aria-value-text="32 / 128 GB"
          >
            <template #label="{ percentage }">
              <span class="inline-flex items-baseline gap-2">
                <span>媒体存储</span>
                <span class="font-mono text-xs text-fg-muted">
                  {{ Math.round(percentage) }}% 已用
                </span>
              </span>
            </template>
            <template #value="{ value, max }">
              <span class="font-mono">{{ value }} / {{ max }} GB</span>
            </template>
          </Progress>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="Progress Props and Slots" :rows="PROGRESS_API" />
    </ComponentDocsSection>

    <ComponentDocsSection title="EmptyState" class="mt-16">
      <template #description>
        默认只渲染图标与说明；icon 和 action 都是明确插槽。组件不内置
        i18n，也不假设页面上存在“添加”按钮。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="默认图标" class="mt-4">
          <EmptyState text="暂无文章" />
        </SpecimenCase>

        <SpecimenCase label="自定义图标" class="mt-5">
          <EmptyState text="暂无友链，成为第一个！">
            <template #icon>
              <Users aria-hidden="true" class="size-8" />
            </template>
          </EmptyState>
        </SpecimenCase>

        <SpecimenCase label="长文案" class="mt-5">
          <EmptyState text="当前筛选条件下没有匹配的内容，可以尝试清除筛选条件后重新查看。" />
        </SpecimenCase>

        <SpecimenCase label="引导操作" class="mt-5">
          <EmptyState text="还没有文章，从第一篇开始。">
            <template #action>
              <ButtonSecondary text="创建第一篇文章" />
            </template>
          </EmptyState>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="EmptyState API" :rows="EMPTY_STATE_API" />
    </ComponentDocsSection>
  </div>
</template>
