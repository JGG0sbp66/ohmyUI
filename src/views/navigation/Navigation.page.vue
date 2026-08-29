<!-- src/views/navigation/Navigation.page.vue -->
<script setup lang="ts">
import { ref } from "vue";

import Pagination from "@/components/navigation/Pagination.vue";

import ApiTable from "../components/ApiTable.vue";
import ComponentDocsSection from "../components/ComponentDocsSection.vue";
import SpecimenCase from "../components/SpecimenCase.vue";
import SpecimenPair from "../components/SpecimenPair.vue";

const shortPage = ref(3);
const startPage = ref(1);
const middlePage = ref(10);
const endPage = ref(20);
const compactPage = ref(10);

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
      Pagination 保留 ohmyblog 的 40px 圆形按钮、固定七槽算法和强调背景，内部改为语义化分页导航。
      小屏自动收成三段式，也可以通过 compact 主动启用。
    </p>

    <ComponentDocsSection title="Pagination" class="mt-10">
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
            />
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
