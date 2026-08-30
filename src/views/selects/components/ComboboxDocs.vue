<script setup lang="ts">
import {
  ChartLine,
  FilePenLine,
  FilePlus2,
  Files,
  Handshake,
  MessageSquareText,
  Settings,
  ShieldAlert,
} from "@lucide/vue";
import { computed, ref } from "vue";

import type { ComboboxOption, ComboboxValue } from "@/components/combobox/combobox.types";
import Combobox from "@/components/combobox/Combobox.vue";
import type { SegmentedControlOption } from "@/components/control/control.types";
import SegmentedControl from "@/components/control/SegmentedControl.vue";

import ApiTable from "../../components/ApiTable.vue";
import ComponentDocsSection from "../../components/ComponentDocsSection.vue";
import SpecimenCase from "../../components/SpecimenCase.vue";
import SpecimenPair from "../../components/SpecimenPair.vue";
import AsyncComboboxPreview from "./AsyncComboboxPreview.vue";

const LANGUAGE_OPTIONS = [
  { value: "plaintext", label: "纯文本", textValue: "plaintext text txt" },
  { value: "typescript", label: "TypeScript", textValue: "typescript ts" },
  { value: "javascript", label: "JavaScript", textValue: "javascript js" },
  { value: "vue", label: "Vue", textValue: "vue sfc" },
  { value: "html", label: "HTML", textValue: "html markup" },
  { value: "css", label: "CSS", textValue: "css style" },
  { value: "json", label: "JSON", textValue: "json data" },
  { value: "markdown", label: "Markdown", textValue: "markdown md" },
  { value: "sql", label: "SQL", textValue: "sql database" },
  { value: "shell", label: "Shell", textValue: "shell bash sh" },
  { value: "legacy", label: "Legacy 模式", textValue: "legacy", disabled: true },
] satisfies readonly ComboboxOption[];

const DESTINATION_OPTIONS = [
  {
    value: "posts",
    label: "文章管理",
    textValue: "posts content p",
    description: "查看、筛选与编辑全部文章",
    icon: Files,
  },
  {
    value: "new-post",
    label: "新建文章",
    textValue: "new post compose n",
    description: "打开一个空白编辑器",
    icon: FilePlus2,
  },
  {
    value: "drafts",
    label: "草稿箱",
    textValue: "drafts unfinished d",
    description: "继续最近未完成的写作",
    icon: FilePenLine,
  },
  {
    value: "comments",
    label: "评论审核",
    textValue: "comments moderation c",
    description: "处理待审核与举报内容",
    icon: MessageSquareText,
  },
  {
    value: "friends",
    label: "友链管理",
    textValue: "friends links f",
    description: "维护站点与伙伴链接",
    icon: Handshake,
  },
  {
    value: "analytics",
    label: "访问分析",
    textValue: "analytics traffic a",
    description: "浏览近期阅读趋势",
    icon: ChartLine,
  },
  {
    value: "settings",
    label: "系统设置",
    textValue: "settings system s",
    description: "配置站点、邮件与安全策略",
    icon: Settings,
  },
  {
    value: "danger-zone",
    label: "危险区域",
    textValue: "danger zone",
    description: "当前账户没有访问权限",
    icon: ShieldAlert,
    disabled: true,
  },
] satisfies readonly ComboboxOption[];

function filterOptions(
  options: readonly ComboboxOption[],
  candidate: string,
): readonly ComboboxOption[] {
  const normalized = candidate.trim().toLocaleLowerCase();
  if (!normalized) return options;

  return options.filter((option) => {
    const searchable = `${option.label} ${option.textValue ?? ""} ${option.description ?? ""}`;
    return searchable.toLocaleLowerCase().includes(normalized);
  });
}

function destinationShortcut(value: ComboboxValue): string {
  const shortcuts: Record<string, string> = {
    posts: "G P",
    "new-post": "N",
    drafts: "G D",
    comments: "G C",
    friends: "G F",
    analytics: "G A",
    settings: "G S",
    "danger-zone": "—",
  };
  return shortcuts[String(value)] ?? "";
}

const languageValue = ref<ComboboxValue | null>("typescript");
const languageQuery = ref("TypeScript");
const filteredLanguages = computed(() => filterOptions(LANGUAGE_OPTIONS, languageQuery.value));
const destinationValue = ref<ComboboxValue | null>(null);
const destinationQuery = ref("");
const filteredDestinations = computed(() =>
  filterOptions(DESTINATION_OPTIONS, destinationQuery.value),
);
const sheetValue = ref<ComboboxValue | null>(null);
const sheetQuery = ref("");
const disabledValue = ref<ComboboxValue | null>("vue");
const disabledQuery = ref("Vue");
const feedbackValue = ref<ComboboxValue | null>(null);
const feedbackQuery = ref("");

type FeedbackMode = "loading" | "empty" | "error";
const feedbackMode = ref<FeedbackMode>("loading");
const feedbackModes = [
  { value: "loading", label: "加载" },
  { value: "empty", label: "空结果" },
  { value: "error", label: "失败" },
] satisfies readonly SegmentedControlOption<FeedbackMode>[];
const feedbackLoading = computed(() => feedbackMode.value === "loading");
const feedbackError = computed(() =>
  feedbackMode.value === "error" ? "无法读取结果，请修改关键词后重试" : undefined,
);

const COMBOBOX_API = [
  ["modelValue", "string | number | null", "null", "已提交选项值；与正在编辑的 query 分离"],
  ["query", "string", '""', "真实输入文本，支持 v-model:query；不会被 debounce 延迟"],
  ["open", "boolean", "false", "受控打开状态，支持 v-model:open"],
  [
    "options",
    "readonly ComboboxOption[]",
    "—",
    "调用方提供当前结果；value 必须唯一，组件不内置筛选或请求",
  ],
  ["label", "string", "—", "输入框与 listbox 的无障碍名称"],
  ["placeholder", "string", "未传", "没有输入时的提示文字"],
  [
    "clearable / clearLabel",
    "boolean / string",
    'false / "清除输入"',
    "同时清空 selection 与 query，并保留输入焦点",
  ],
  [
    "loading / loadingLabel",
    "boolean / string",
    'false / "正在加载"',
    "反馈行不是 option，不参与键盘导航",
  ],
  ["error", "string", "未传", "结果加载失败文案；优先于 empty 状态"],
  ["emptyLabel", "string", '"没有匹配结果"', "没有结果时的反馈文案"],
  ["disabled / required / invalid", "boolean", "false", "字段状态与对应原生 ARIA 属性"],
  [
    "presentation",
    '"auto" | "popover" | "sheet"',
    '"auto"',
    "auto 在 640px 处切壳，并只挂载一个输入框",
  ],
  ["placement / offset", "AnchoredPlacement / number", '"bottom-start" / 8', "Popover 定位参数"],
  ["sheetTitle / sheetDescription", "string", "label / 未传", "BottomSheet 标题与说明"],
  ["@change", "(value) => void", "—", "用户选择、清除或编辑导致 selection 变化时触发"],
  ["@query-change", "(query) => void", "—", "组件内输入、选择、清除或 Escape 恢复文本时触发"],
  ["@open-change", "(open) => void", "—", "呈现层开关变化后触发"],
  [
    "#option",
    "{ option, active, selected }",
    "—",
    "自定义结果内容，行语义、状态与勾选仍由组件负责",
  ],
  ["#loading / #empty / #error", "{ label }", "—", "覆盖非 option 反馈内容"],
] as const;
</script>

<template>
  <ComponentDocsSection title="Combobox" class="mt-16">
    <template #description>
      Combobox 把已提交 selection、即时 query 与 open 拆成三个受控状态。桌面焦点始终留在原生输入框，
      通过
      <code class="font-mono text-fg">aria-activedescendant</code> 导航结果；异步请求、缓存和防抖
      留给调用方。
    </template>

    <SpecimenPair class="mt-6">
      <SpecimenCase label="本地过滤、清除与禁用项" class="mt-4">
        <Combobox
          v-model="languageValue"
          v-model:query="languageQuery"
          label="代码语言"
          placeholder="搜索语言"
          :options="filteredLanguages"
          clearable
          block
        />
        <p class="mt-2 font-mono text-xs text-fg-muted">
          value: {{ languageValue ?? "null" }} · query: {{ languageQuery || '""' }}
        </p>
        <p class="mt-1 text-xs/5 text-fg-soft">Legacy 模式为 disabled，方向键会自动跳过。</p>
      </SpecimenCase>

      <SpecimenCase label="长结果与自定义 option" class="mt-5">
        <Combobox
          v-model="destinationValue"
          v-model:query="destinationQuery"
          label="快速前往"
          placeholder="搜索页面或操作"
          :options="filteredDestinations"
          clearable
          block
          panel-class="w-80"
        >
          <template #option="{ option }">
            <component
              :is="option.icon"
              v-if="option.icon"
              aria-hidden="true"
              class="size-4 shrink-0 text-accent"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate font-medium">{{ option.label }}</span>
              <span class="mt-0.5 block truncate text-xs text-fg-muted">
                {{ option.description }}
              </span>
            </span>
            <kbd class="shrink-0 font-mono text-[0.625rem] text-fg-soft">
              {{ destinationShortcut(option.value) }}
            </kbd>
          </template>
        </Combobox>
        <p class="mt-2 text-xs/5 text-fg-muted">
          自定义 slot 只接管内容；option 的 ARIA、active、disabled 与提交逻辑不丢失。
        </p>
      </SpecimenCase>
    </SpecimenPair>

    <SpecimenPair v-slot="{ tone }" class="mt-4">
      <SpecimenCase label="受控异步查询与乱序响应" class="mt-4">
        <AsyncComboboxPreview :tone="tone" />
      </SpecimenCase>

      <SpecimenCase label="加载、空结果、失败与禁用" class="mt-5">
        <SegmentedControl v-model="feedbackMode" :options="feedbackModes" label="结果反馈状态" />
        <Combobox
          :id="`feedback-combobox-${tone}`"
          v-model="feedbackValue"
          v-model:query="feedbackQuery"
          label="结果状态"
          placeholder="点击查看反馈"
          :options="[]"
          :loading="feedbackLoading"
          :error="feedbackError"
          loading-label="正在同步远端索引"
          empty-label="当前关键词没有结果"
          block
          class="mt-3"
        />
        <Combobox
          :id="`disabled-combobox-${tone}`"
          v-model="disabledValue"
          v-model:query="disabledQuery"
          label="禁用的语言"
          :options="LANGUAGE_OPTIONS"
          disabled
          block
          class="mt-3"
        />
      </SpecimenCase>
    </SpecimenPair>

    <SpecimenPair class="mt-4">
      <SpecimenCase label="强制 BottomSheet" class="mt-4">
        <Combobox
          v-model="sheetValue"
          v-model:query="sheetQuery"
          label="移动端快速前往"
          placeholder="搜索页面"
          :options="filterOptions(DESTINATION_OPTIONS, sheetQuery)"
          presentation="sheet"
          sheet-title="快速前往"
          sheet-description="输入关键词后选择目标页面"
          clearable
          block
        />
        <p class="mt-2 text-xs/5 text-fg-muted">
          桌面点击也会打开 BottomSheet；外部只保留 launcher，唯一输入框挂载在面板内。
        </p>
      </SpecimenCase>

      <SpecimenCase label="键盘与状态约束" class="mt-5">
        <ul class="space-y-2 text-xs/5 text-fg-muted">
          <li>• Arrow 循环移动；Home / End 跳到边界；导航自动跳过 disabled。</li>
          <li>• Enter 只提交 active option；IME composition 期间不会误提交。</li>
          <li>• Escape 撤销本轮文本编辑；选择与清除即时提交，并成为新的回滚基线。</li>
          <li>• loading、error 与 empty 是反馈行，不会进入 aria-activedescendant。</li>
          <li>• 断点切壳会先关闭旧浮层，再把焦点交给新 launcher。</li>
        </ul>
      </SpecimenCase>
    </SpecimenPair>

    <ApiTable caption="Combobox Props, Events and Slots" :rows="COMBOBOX_API" />
  </ComponentDocsSection>
</template>
