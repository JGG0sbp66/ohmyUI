<!-- src/views/navigation/Navigation.page.vue -->
<script setup lang="ts">
import { Archive, ArrowLeft, ArrowRight, Flag, Inbox, Mail } from "@lucide/vue";
import { computed, ref } from "vue";

import type { FilterTabOption, FilterTabValue } from "@/components/navigation/filter-tabs.types";
import FilterTabs from "@/components/navigation/FilterTabs.vue";
import Pagination from "@/components/navigation/Pagination.vue";

import ApiTable from "../components/ApiTable.vue";
import ComponentDocsSection from "../components/ComponentDocsSection.vue";
import SpecimenCase from "../components/SpecimenCase.vue";
import SpecimenPair from "../components/SpecimenPair.vue";

const ARTICLE_STATUS_OPTIONS = [
  { value: null, label: "全部", count: 8 },
  { value: "published", label: "已发布", count: 4 },
  { value: "draft", label: "草稿", count: 2 },
  { value: "archived", label: "归档", count: 1 },
  { value: "deleted", label: "回收站", count: 1 },
] as const satisfies readonly FilterTabOption[];

const REVIEW_STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待审核" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
  { value: "withdrawn", label: "已撤回", disabled: true },
] as const satisfies readonly FilterTabOption[];

const QUEUE_OPTIONS = [
  { value: "all", label: "全部", count: 36, icon: Inbox },
  { value: "unread", label: "未读", count: 12, icon: Mail },
  { value: "flagged", label: "已标记", count: 3, icon: Flag },
  { value: "archived", label: "已归档", count: 21, icon: Archive },
] as const satisfies readonly FilterTabOption[];

const LONG_FILTER_OPTIONS = [
  { value: "all", label: "全部内容", count: 128 },
  { value: "manual", label: "等待人工复核", count: 16 },
  { value: "risk", label: "存在风险的内容", count: 5 },
  { value: "hidden", label: "已隐藏的历史记录", count: 24 },
  { value: "deleted", label: "永久删除", count: 2 },
] as const satisfies readonly FilterTabOption[];

const articleStatus = ref<FilterTabValue>(null);
const reviewStatus = ref<FilterTabValue>("pending");
const queueStatus = ref<FilterTabValue>("unread");
const longFilter = ref<FilterTabValue>("deleted");

const currentArticleOption = computed(() =>
  ARTICLE_STATUS_OPTIONS.find((option) => Object.is(option.value, articleStatus.value)),
);

const shortPage = ref(3);
const startPage = ref(1);
const middlePage = ref(10);
const endPage = ref(20);
const compactPage = ref(10);

const FILTER_TABS_API = [
  ["modelValue", "string | number | null", "必填", "当前筛选值；通过 v-model 完全受控"],
  ["options", "readonly FilterTabOption[]", "必填", "自然宽度选项；value 在同组中必须唯一"],
  ["label", "string", "必填", "radiogroup 的无障碍名称"],
  ["disabled", "boolean", "false", "禁用整个筛选组"],
  [
    "countVisibility",
    '"active" | "always" | "never"',
    '"active"',
    "数量仅随活动项显示、始终显示或完全隐藏",
  ],
  [
    "FilterTabOption",
    "{ value, label, count?, disabled?, icon?, iconClass? }",
    "—",
    "单项可禁用；图标默认按装饰内容处理",
  ],
  ["class / style / 原生属性", "透传", "未传", "作用于可横向滚动的 radiogroup 根节点"],
  ["#icon", "slot({ option, selected, disabled })", "option.icon", "替换选项装饰图标"],
  ["#count", "slot({ option, selected, disabled })", "Tag size=sm", "替换已有 count 的呈现"],
  [
    "@update:modelValue",
    "(value: FilterTabValue) => void",
    "—",
    "点击或键盘移动到可用的非当前项时触发",
  ],
] as const;

const PAGINATION_API = [
  ["modelValue", "number", "必填", "当前页；1..totalPages 的安全整数"],
  ["totalPages", "number", "必填", "总页数；0 或 1 时不渲染"],
  ["label", "string", "必填", "nav 的无障碍名称"],
  ["previousLabel", "string", "必填", "上一页按钮的无障碍名称"],
  ["nextLabel", "string", "必填", "下一页按钮的无障碍名称"],
  ["disabled", "boolean", "false", "禁用全部页码和箭头"],
  ["compact", "boolean", "false", "强制使用上一页 / 当前页 / 下一页布局"],
  ["class / style / 原生属性", "透传", "未传", "作用于 nav 根节点"],
  ["#previous", "slot", "内置左箭头", "只替换装饰图形"],
  ["#next", "slot", "内置右箭头", "只替换装饰图形"],
  ["@update:modelValue", "(value: number) => void", "—", "选择合法且非当前的页码时触发"],
] as const;
</script>

<template>
  <div>
    <p class="max-w-xl text-sm/6 text-fg-muted">
      FilterTabs 负责同一结果集的单选筛选，Pagination
      负责结果分页。两者都保持完全受控，数据请求、路由同步和筛选后重置页码仍由页面拥有者处理。
    </p>

    <ComponentDocsSection title="FilterTabs" class="mt-10">
      <template #description>
        自然宽度的横向筛选导航，适合状态、审核结果和收件箱等列表视图。它使用
        radiogroup/radio，而不是要求对应 tabpanel 的 Tabs 语义。
      </template>

      <SpecimenPair v-slot="{ tone }" class="mt-6 sm:grid-cols-1!">
        <SpecimenCase label="文章状态 · 仅活动项显示数量" class="mt-4 min-w-0">
          <div class="border-b border-border/40 px-5 pt-4 pb-3">
            <FilterTabs
              v-model="articleStatus"
              class="-mb-4"
              :label="`${tone} 文章状态筛选`"
              :options="ARTICLE_STATUS_OPTIONS"
            />
          </div>
          <div
            class="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-fg-muted"
          >
            <span>
              当前：{{ currentArticleOption?.label ?? "未匹配" }}
              <template v-if="currentArticleOption?.count !== undefined">
                · {{ currentArticleOption.count }} 条
              </template>
            </span>
            <span>筛选改变后由结果页重置 Pagination</span>
          </div>
        </SpecimenCase>

        <SpecimenCase label="无数量 · 单项禁用" class="mt-5 min-w-0">
          <FilterTabs
            v-model="reviewStatus"
            :label="`${tone} 审核状态筛选`"
            :options="REVIEW_STATUS_OPTIONS"
          />
          <p class="mt-2 px-1 text-xs text-fg-muted">“已撤回”不可选择；方向键会自动跳过它。</p>
        </SpecimenCase>

        <SpecimenCase label="数量始终显示" class="mt-5 min-w-0">
          <FilterTabs
            v-model="queueStatus"
            :label="`${tone} 消息队列筛选`"
            :options="QUEUE_OPTIONS"
            count-visibility="always"
          />
        </SpecimenCase>

        <SpecimenCase label="320px 宽度 · 单行横向滚动" class="mt-5 min-w-0">
          <div class="max-w-80 rounded-xl border border-border/60 bg-bg/40 p-1">
            <FilterTabs
              v-model="longFilter"
              :label="`${tone} 长文案筛选`"
              :options="LONG_FILTER_OPTIONS"
            />
          </div>
          <p class="mt-2 px-1 text-xs text-fg-muted">
            初始选中最后一项；选中项会横向滚入视口，触控和滚轮仍可继续浏览。
          </p>
        </SpecimenCase>

        <SpecimenCase label="整体禁用" class="mt-5 min-w-0">
          <FilterTabs
            model-value="draft"
            :label="`${tone} 禁用文章筛选`"
            :options="ARTICLE_STATUS_OPTIONS"
            disabled
          />
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="FilterTabs Props, Slots and Events" :rows="FILTER_TABS_API" />
    </ComponentDocsSection>

    <ComponentDocsSection title="Pagination" class="mt-16">
      <template #description>
        完全受控的页码导航。页数较少时全部展开；页数较多时固定显示首尾页、当前区间和省略号。
      </template>

      <SpecimenPair v-slot="{ tone }" class="mt-6 sm:grid-cols-1!">
        <SpecimenCase label="少页数 · 全部展开" class="mt-4">
          <Pagination
            v-model="shortPage"
            :label="`${tone} 少页数分页`"
            previous-label="上一页"
            next-label="下一页"
            :total-pages="5"
          />
          <p class="mt-2 text-right text-xs text-fg-muted">当前页：{{ shortPage }}</p>
        </SpecimenCase>

        <SpecimenCase label="长列表 · 起始 / 中间 / 末尾" class="mt-5">
          <div class="space-y-3">
            <Pagination
              v-model="startPage"
              :label="`${tone} 起始分页`"
              previous-label="上一页"
              next-label="下一页"
              :total-pages="20"
            />
            <Pagination
              v-model="middlePage"
              :label="`${tone} 中间分页`"
              previous-label="上一页"
              next-label="下一页"
              :total-pages="20"
            />
            <Pagination
              v-model="endPage"
              :label="`${tone} 末尾分页`"
              previous-label="上一页"
              next-label="下一页"
              :total-pages="20"
            />
          </div>
        </SpecimenCase>

        <SpecimenCase label="紧凑布局" class="mt-5">
          <div class="ml-auto max-w-72">
            <Pagination
              v-model="compactPage"
              :label="`${tone} 紧凑分页`"
              previous-label="上一页"
              next-label="下一页"
              :total-pages="20"
              compact
            >
              <template #previous>
                <ArrowLeft aria-hidden="true" class="size-4" />
              </template>
              <template #next>
                <ArrowRight aria-hidden="true" class="size-4" />
              </template>
            </Pagination>
          </div>
        </SpecimenCase>

        <SpecimenCase label="整体禁用" class="mt-5">
          <Pagination
            :model-value="10"
            :label="`${tone} 禁用分页`"
            previous-label="上一页"
            next-label="下一页"
            :total-pages="20"
            disabled
          />
        </SpecimenCase>

        <SpecimenCase label="0 / 1 页" class="mt-5">
          <div
            class="rounded-xl border border-dashed border-border/60 px-4 py-3 text-xs text-fg-muted"
          >
            totalPages 小于等于 1 时不生成分页 DOM。
            <Pagination
              :model-value="1"
              :label="`${tone} 单页分页`"
              previous-label="上一页"
              next-label="下一页"
              :total-pages="1"
            />
          </div>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="Pagination Props, Slots and Events" :rows="PAGINATION_API" />
    </ComponentDocsSection>
  </div>
</template>
