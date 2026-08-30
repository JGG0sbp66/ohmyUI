<!-- src/views/controls/Controls.page.vue -->
<script setup lang="ts">
import { Eye, List, Rows3 } from "@lucide/vue";
import { ref } from "vue";

import ButtonThird from "@/components/button/ButtonThird.vue";
import Checkbox from "@/components/control/Checkbox.vue";
import type { SegmentedControlOption } from "@/components/control/control.types";
import SegmentedControl from "@/components/control/SegmentedControl.vue";
import Switch from "@/components/control/Switch.vue";

import ApiTable from "../components/ApiTable.vue";
import ComponentDocsSection from "../components/ComponentDocsSection.vue";
import SpecimenCase from "../components/SpecimenCase.vue";
import SpecimenPair from "../components/SpecimenPair.vue";

const unchecked = ref(false);
const checked = ref(true);
const mixedValue = ref(false);
const mixed = ref(true);

const handleMixedChange = (value: boolean) => {
  mixedValue.value = value;
  mixed.value = false;
};

const resetMixed = () => {
  mixedValue.value = false;
  mixed.value = true;
};

const switchOff = ref(false);
const switchOn = ref(true);

type PostStatus = "draft" | "published" | "archived";
const status = ref<PostStatus>("draft");
const statusOptions = [
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
  { value: "archived", label: "已归档" },
] as const satisfies readonly SegmentedControlOption<PostStatus>[];

type ViewMode = "list" | "compact" | "preview";
const viewMode = ref<ViewMode>("list");
const viewModeOptions = [
  { value: "list", label: "列表", icon: List },
  { value: "compact", label: "紧凑", icon: Rows3 },
  {
    value: "preview",
    label: "预览",
    icon: Eye,
    iconClass: "h-2.5 w-auto",
  },
] as const satisfies readonly SegmentedControlOption<ViewMode>[];

const PROPS = {
  Checkbox: [
    ["modelValue", "boolean", "false", "选中状态"],
    ["indeterminate", "boolean", "false", "半选视觉与 aria-checked=mixed；不改变 modelValue"],
    ["disabled", "boolean", "false", "禁用原生按钮"],
    ["label", "string", "必填", "无可见文字控件的无障碍名称"],
    ["class / style / 原生属性", "透传", "未传", "作用于 button 根节点"],
    ["@update:modelValue", "(value: boolean) => void", "—", "状态改变时触发"],
  ],
  Switch: [
    ["modelValue", "boolean", "false", "开关状态"],
    ["disabled", "boolean", "false", "禁用内部原生 checkbox"],
    ["label", "string", "必填", "绑定到内部 input 的 aria-label"],
    ["class / style", "HTMLAttributes", "未传", "作用于最外层 label"],
    ["其余原生属性", "透传", "未传", "作用于内部 input"],
    ["@update:modelValue", "(value: boolean) => void", "—", "状态改变时触发"],
  ],
  SegmentedControl: [
    ["modelValue", "T", "必填", "当前选中值"],
    ["options", "readonly SegmentedControlOption<T>[]", "必填", "等宽选项；value 必须唯一"],
    ["options[].label", "string", "必填", "选项可见文字"],
    ["options[].icon", "Component", "未传", "文字左侧的装饰图标"],
    ["options[].iconClass", "HTMLAttributes['class']", "h-3.5 w-auto", "覆盖图标默认尺寸"],
    ["options[].disabled", "boolean", "false", "禁用单个选项"],
    ["label", "string", "必填", "radiogroup 的无障碍名称"],
    ["disabled", "boolean", "false", "禁用整组控件"],
    ["class / style / 原生属性", "透传", "未传", "作用于 radiogroup 根节点"],
    ["@update:modelValue", "(value: T) => void", "—", "选择选项时触发"],
  ],
} as const;
</script>

<template>
  <div>
    <p class="max-w-xl text-sm/6 text-fg-muted">
      三种控件沿用 ohmyblog 的尺寸、圆角、阴影与动效，内部改成完整的受控状态和键盘语义。
      浅色、深色两栏共享同一份 model，任意一侧操作都会同步到另一侧。
    </p>

    <ComponentDocsSection title="Checkbox" class="mt-10">
      <template #description>
        20px 圆形选择框，支持未选、已选和半选三种视觉。半选是独立展示状态，不会偷偷改写布尔值。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="状态" class="mt-4">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs text-fg-muted">
            <div class="flex items-center gap-2">
              <Checkbox v-model="unchecked" label="未选" />
              <span>未选</span>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox v-model="checked" label="已选" />
              <span>已选</span>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox :model-value="false" indeterminate label="半选" />
              <span>半选</span>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox :model-value="false" disabled label="禁用未选" />
              <span>禁用</span>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox :model-value="true" disabled label="禁用已选" />
              <span>禁用已选</span>
            </div>
          </div>
        </SpecimenCase>

        <SpecimenCase label="受控半选" class="mt-5">
          <div class="flex items-center gap-3">
            <Checkbox
              :model-value="mixedValue"
              :indeterminate="mixed"
              label="受控半选示例"
              @update:model-value="handleMixedChange"
            />
            <span class="text-xs text-fg-muted" aria-live="polite">
              {{ mixed ? "mixed" : String(mixedValue) }}
            </span>
            <ButtonThird text="重置" @click="resetMixed" />
          </div>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="Checkbox Props" :rows="PROPS.Checkbox" />
    </ComponentDocsSection>

    <ComponentDocsSection title="Switch" class="mt-16">
      <template #description>
        48 × 28px 布尔开关。保留原来的轨道与白色滑块，动画统一使用项目默认时长，真实交互由原生
        checkbox 承担。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="状态" class="mt-4">
          <div class="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-fg-muted">
            <div class="flex items-center gap-2">
              <Switch v-model="switchOff" label="关闭" />
              <span>关闭</span>
            </div>
            <div class="flex items-center gap-2">
              <Switch v-model="switchOn" label="开启" />
              <span>开启</span>
            </div>
            <div class="flex items-center gap-2">
              <Switch :model-value="false" disabled label="禁用关闭" />
              <span>禁用</span>
            </div>
            <div class="flex items-center gap-2">
              <Switch :model-value="true" disabled label="禁用开启" />
              <span>禁用开启</span>
            </div>
          </div>
        </SpecimenCase>

        <SpecimenCase label="原生属性透传" class="mt-5">
          <div class="flex items-center gap-3">
            <Switch v-model="switchOn" label="邮件通知" name="notifications" required />
            <span class="text-xs text-fg-muted">name / required 落在内部 input</span>
          </div>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="Switch Props" :rows="PROPS.Switch" />
    </ComponentDocsSection>

    <ComponentDocsSection title="SegmentedControl" class="mt-16">
      <template #description>
        等宽单选分段器。视觉仍是 4px 内边距、浮起的卡片指示块；新增单选组语义，以及方向键、
        Home、End 导航。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="纯文字" class="mt-4">
          <SegmentedControl
            v-model="status"
            :options="statusOptions"
            label="文章状态"
            class="w-full"
          />
          <p class="mt-2 text-xs text-fg-muted">当前：{{ status }}</p>
        </SpecimenCase>

        <SpecimenCase label="图标与自定义图标高度" class="mt-5">
          <SegmentedControl
            v-model="viewMode"
            :options="viewModeOptions"
            label="视图模式"
            class="w-full"
          />
        </SpecimenCase>

        <SpecimenCase label="禁用" class="mt-5">
          <SegmentedControl
            v-model="status"
            :options="statusOptions"
            label="禁用的文章状态"
            class="w-full"
            disabled
          />
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="SegmentedControl Props" :rows="PROPS.SegmentedControl" />
    </ComponentDocsSection>
  </div>
</template>
