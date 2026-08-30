<script setup lang="ts">
import { FilePenLine, FileText, Settings, Users } from "@lucide/vue";
import { computed, ref } from "vue";

import InputField from "@/components/input/InputField.vue";
import GroupedSelect from "@/components/select/GroupedSelect.vue";
import type { SelectGroup, SelectOption, SelectValue } from "@/components/select/select.types";
import Select from "@/components/select/Select.vue";

import ApiTable from "../components/ApiTable.vue";
import ComponentDocsSection from "../components/ComponentDocsSection.vue";
import SpecimenCase from "../components/SpecimenCase.vue";
import SpecimenPair from "../components/SpecimenPair.vue";
import ComboboxDocs from "./components/ComboboxDocs.vue";

const statusOptions = [
  { value: "draft", label: "草稿" },
  { value: "review", label: "审核中", disabled: true },
  { value: "published", label: "已发布" },
  { value: "archived", label: "已归档" },
] satisfies readonly SelectOption[];

const longLabelOptions = [
  { value: 1, label: "默认文章分类" },
  { value: 2, label: "这是一个会在紧凑触发器中自动截断的超长分类名称" },
  { value: 3, label: "产品设计与前端工程实践" },
] satisfies readonly SelectOption[];

const groupedOptions = [
  {
    key: "content",
    label: "内容",
    options: [
      {
        value: "posts",
        label: "文章",
        description: "管理已发布内容",
        icon: FileText,
        iconClass: "text-sky-500",
      },
      {
        value: "drafts",
        label: "草稿箱",
        description: "继续未完成的写作",
        icon: FilePenLine,
        iconClass: "text-amber-500",
      },
    ],
  },
  {
    key: "site",
    label: "站点",
    options: [
      {
        value: "friends",
        label: "友链",
        description: "站点与伙伴链接",
        icon: Users,
        iconClass: "text-emerald-500",
      },
      {
        value: "settings",
        label: "系统设置",
        description: "仅管理员可以修改",
        icon: Settings,
        iconClass: "text-violet-500",
        disabled: true,
      },
    ],
  },
] satisfies readonly SelectGroup[];

const emptyOptions: readonly SelectOption[] = [];
const statusValue = ref<SelectValue | null>("published");
const clearableValue = ref<SelectValue | null>(null);
const groupedValue = ref<SelectValue | null>("posts");
const longLabelValue = ref<SelectValue | null>(2);
const requiredValue = ref<SelectValue | null>(null);
const disabledValue = ref<SelectValue | null>("archived");
const automaticValue = ref<SelectValue | null>("draft");
const sheetValue = ref<SelectValue | null>("published");
const emptyValue = ref<SelectValue | null>(null);

const requiredError = computed(() =>
  requiredValue.value === null ? "请选择默认文章状态" : undefined,
);

const SELECT_API = [
  ["modelValue", "string | number | null", "null", "当前选项值；null 明确表示未选择"],
  ["open", "boolean", "false", "受控打开状态，支持 v-model:open"],
  ["options", "readonly SelectOption[]", "—", "扁平选项；可包含图标、描述与 disabled"],
  ["label", "string", "—", "触发器与 listbox 的无障碍名称"],
  ["placeholder", "string", "label", "没有选中项时的触发器文案"],
  ["clearable", "boolean", "false", "在 listbox 顶部提供值为 null 的清除项"],
  ["clearLabel", "string", '"清除选择"', "清除项的可见文案与 typeahead 文本"],
  ["emptyLabel", "string", '"暂无可选项"', "options 为空时的反馈文案"],
  ["disabled", "boolean", "false", "禁用触发器和所有选项"],
  ["required", "boolean", "false", "透传 aria-required；可由 InputField 下发"],
  ["invalid", "boolean", "false", "错误视觉与 aria-invalid"],
  ["block", "boolean", "false", "触发器占满所在容器"],
  ["presentation", '"auto" | "popover" | "sheet"', '"auto"', "auto 在 640px 处切换呈现层"],
  ["placement", "AnchoredPlacement", '"bottom-start"', "Popover 首选方向与对齐"],
  ["panelClass", "HTMLAttributes['class']", "未传", "调整 Popover 面板样式"],
  ["@change", "(value) => void", "—", "用户提交选项后触发"],
  ["@open-change", "(open) => void", "—", "呈现层开关变化后触发"],
] as const;

const GROUPED_SELECT_API = [
  ["groups", "readonly SelectGroup[]", "—", "带稳定 key、可选 label 与 options 的分组集合"],
  ["modelValue", "string | number | null", "null", "与 Select 使用相同值协议"],
  ["clearable", "boolean", "false", "清除项位于所有分组之前"],
  ["presentation", '"auto" | "popover" | "sheet"', '"auto"', "两种外壳复用同一份分组选项 DOM"],
  ["其余字段", "SelectCommonProps", "—", "与 Select 的 label、状态、定位及字段属性一致"],
] as const;
</script>

<template>
  <div>
    <p class="max-w-xl text-sm/6 text-fg-muted">
      选择器保留 ohmyblog 的 40px 紧凑触发器、选中底色和强调色勾选；内部重构为标准 listbox。桌面使用
      Popover，窄屏自动切换 BottomSheet，但两种外壳始终共享同一份选项结构。
    </p>

    <ComponentDocsSection title="Select" class="mt-10">
      <template #description>
        Select 接收扁平 options。值统一为
        <code class="font-mono text-fg">string | number | null</code>
        ，其中 null 明确表示未选择或“全部”，不会再用 undefined 混合表达业务状态。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="默认与清除" class="mt-4">
          <div class="space-y-5">
            <div>
              <Select
                v-model="statusValue"
                label="文章状态"
                :options="statusOptions"
                placeholder="选择状态"
              />
              <p class="mt-2 font-mono text-xs text-fg-muted">model: {{ statusValue ?? "null" }}</p>
            </div>

            <div>
              <Select
                v-model="clearableValue"
                label="文章状态"
                :options="statusOptions"
                placeholder="选择状态"
                clearable
                clear-label="全部状态"
              />
              <p class="mt-2 text-xs text-fg-muted">清除项会提交明确的 null。</p>
            </div>
          </div>
        </SpecimenCase>

        <SpecimenCase label="长文本与边界状态" class="mt-5">
          <div class="space-y-5">
            <div>
              <Select
                v-model="longLabelValue"
                label="文章分类"
                :options="longLabelOptions"
                panel-class="max-h-72"
              />
              <p class="mt-2 text-xs text-fg-muted">超长文案保持紧凑触发器并自动截断。</p>
            </div>

            <div>
              <Select
                v-model="emptyValue"
                label="可用栏目"
                :options="emptyOptions"
                empty-label="当前没有可用栏目"
              />
              <p class="mt-2 text-xs text-fg-muted">打开可检查空集合反馈。</p>
            </div>

            <Select v-model="disabledValue" label="文章状态" :options="statusOptions" disabled />
          </div>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="Select Props and Events" :rows="SELECT_API" />
    </ComponentDocsSection>

    <ComponentDocsSection title="GroupedSelect" class="mt-16">
      <template #description>
        GroupedSelect 只增加数据分组；分组标题使用
        <code class="font-mono text-fg">role="group"</code>
        组织信息，所有选项仍属于同一个 listbox。图标、描述、禁用态与 typeahead 行为和 Select
        完全一致。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="分组、图标与描述" class="mt-4">
          <div>
            <GroupedSelect
              v-model="groupedValue"
              label="内容入口"
              :groups="groupedOptions"
              clearable
              clear-label="全部入口"
            />
            <p class="mt-2 font-mono text-xs text-fg-muted">model: {{ groupedValue ?? "null" }}</p>
          </div>
        </SpecimenCase>

        <SpecimenCase label="交互约束" class="mt-5">
          <ul class="space-y-2 text-xs/5 text-fg-muted">
            <li>• 当前项使用 active 底色和右侧 accent 勾选。</li>
            <li>• “系统设置”为 disabled，鼠标与键盘均不能提交。</li>
            <li>• Arrow、Home、End 会跳过 disabled；连续输入支持 500ms typeahead。</li>
            <li>• Enter 或 Space 提交；桌面 Tab 关闭后继续自然焦点顺序。</li>
          </ul>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="GroupedSelect Props" :rows="GROUPED_SELECT_API" />
    </ComponentDocsSection>

    <ComboboxDocs />

    <ComponentDocsSection title="InputField 组合" class="mt-16">
      <template #description>
        Select 可直接消费 InputField 默认 slot 下发的
        id、required、disabled、invalid、aria-describedby 与 aria-errormessage；字段层无需了解
        Popover 或 BottomSheet 的内部结构。
      </template>

      <SpecimenPair v-slot="{ tone }" class="mt-6">
        <SpecimenCase label="必填与错误关联" class="mt-4">
          <InputField
            :id="`required-post-status-${tone}`"
            label="默认文章状态"
            description="选择后错误状态会自动消失。"
            required
            :error="requiredError"
          >
            <template #default="{ controlAttrs }">
              <Select
                v-bind="controlAttrs"
                v-model="requiredValue"
                label="默认文章状态"
                :options="statusOptions"
                placeholder="请选择状态"
                block
              />
            </template>
          </InputField>
        </SpecimenCase>

        <SpecimenCase label="字段整体禁用" class="mt-5">
          <InputField
            :id="`disabled-post-status-${tone}`"
            label="锁定的文章状态"
            description="字段与触发器同时处于禁用状态。"
            disabled
          >
            <template #default="{ controlAttrs }">
              <Select
                v-bind="controlAttrs"
                v-model="disabledValue"
                label="锁定的文章状态"
                :options="statusOptions"
                block
              />
            </template>
          </InputField>
        </SpecimenCase>
      </SpecimenPair>
    </ComponentDocsSection>

    <ComponentDocsSection title="响应式呈现" class="mt-16">
      <template #description>
        <code class="font-mono text-fg">presentation="auto"</code>
        与 Tailwind sm=640px 断点对齐。强制 sheet
        样例不受视口影响，便于在桌面直接验收移动端尺寸、焦点和拖拽关闭。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="auto：Popover / BottomSheet" class="mt-4">
          <div>
            <Select
              v-model="automaticValue"
              label="自动呈现"
              :options="statusOptions"
              presentation="auto"
            />
            <p class="mt-2 text-xs/5 text-fg-muted">
              桌面显示锚点面板，视口小于 640px 时切换底部面板。
            </p>
          </div>
        </SpecimenCase>

        <SpecimenCase label="强制 BottomSheet" class="mt-5">
          <div>
            <Select
              v-model="sheetValue"
              label="移动端状态"
              sheet-title="选择文章状态"
              sheet-description="选择后面板会自动关闭"
              :options="statusOptions"
              presentation="sheet"
              clearable
              clear-label="全部状态"
            />
            <p class="mt-2 text-xs/5 text-fg-muted">桌面点击也会直接打开 BottomSheet。</p>
          </div>
        </SpecimenCase>
      </SpecimenPair>
    </ComponentDocsSection>
  </div>
</template>
