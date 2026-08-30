<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

import ButtonTertiary from "@/components/button/ButtonTertiary.vue";
import type { ComboboxOption, ComboboxValue } from "@/components/combobox/combobox.types";
import Combobox from "@/components/combobox/Combobox.vue";

const props = defineProps<{ tone: "light" | "dark" }>();

const CATALOG = [
  {
    value: "about",
    label: "About 页面",
    textValue: "about ab a page",
    description: "站点介绍与作者资料",
  },
  {
    value: "abort-controller",
    label: "AbortController 指南",
    textValue: "abort ab a controller request",
    description: "取消过期的网络请求",
  },
  {
    value: "astro-content",
    label: "Astro 内容集合",
    textValue: "astro a content collection",
    description: "内容模型与集合配置",
  },
  {
    value: "api-boundary",
    label: "API 边界记录",
    textValue: "api boundary ab a",
    description: "组件和业务层的职责分界",
  },
  {
    value: "bun-runtime",
    label: "Bun 运行时",
    textValue: "bun runtime",
    description: "脚本、构建与服务端运行时",
  },
  {
    value: "vue-reactivity",
    label: "Vue 响应式原理",
    textValue: "vue reactivity",
    description: "ref、computed 与 watcher",
  },
] satisfies readonly ComboboxOption[];

const value = ref<ComboboxValue | null>(null);
const query = ref("");
const results = ref<readonly ComboboxOption[]>(CATALOG.slice(0, 4));
const loading = ref(false);
const error = ref<string>();
const requestState = ref("显示最近访问");
const ignoredResponses = ref(0);
const requestSequence = ref(0);
let generation = 0;
let controller: AbortController | undefined;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let raceTimer: ReturnType<typeof setTimeout> | undefined;
const transportTimers = new Set<ReturnType<typeof setTimeout>>();

const statusText = computed(() => {
  const ignored = ignoredResponses.value > 0 ? ` · 已拦截 ${ignoredResponses.value} 个旧响应` : "";
  return `${requestState.value}${ignored}`;
});

function abortError(): DOMException {
  return new DOMException("Request aborted", "AbortError");
}

/**
 * 单字符请求故意模拟“不支持取消”的旧接口；更长请求支持 AbortSignal。
 * 一键 fixture 会等 a 请求进入 running 后再写入 ab，稳定生成一个晚到响应。
 */
function searchCatalog(term: string, signal: AbortSignal): Promise<readonly ComboboxOption[]> {
  const normalized = term.trim().toLocaleLowerCase();
  const delay = normalized.length === 1 ? 760 : 220;
  const supportsAbort = normalized.length > 1;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      transportTimers.delete(timer);
      if (normalized === "error") {
        reject(new Error("结果服务暂时不可用，请修改关键词后重试"));
        return;
      }

      resolve(
        CATALOG.filter((option) => {
          const searchable = `${option.label} ${option.textValue ?? ""} ${option.description ?? ""}`;
          return searchable.toLocaleLowerCase().includes(normalized);
        }),
      );
    }, delay);
    transportTimers.add(timer);

    if (!supportsAbort) return;
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        transportTimers.delete(timer);
        reject(abortError());
      },
      { once: true },
    );
  });
}

function scheduleSearch(nextQuery: string): void {
  const requestGeneration = ++generation;
  controller?.abort();
  controller = undefined;
  if (debounceTimer !== undefined) clearTimeout(debounceTimer);
  debounceTimer = undefined;
  error.value = undefined;

  const normalized = nextQuery.trim();
  if (!normalized) {
    loading.value = false;
    results.value = CATALOG.slice(0, 4);
    requestState.value = "显示最近访问";
    return;
  }

  loading.value = true;
  requestState.value = "等待 140ms 防抖";
  const nextController = new AbortController();
  controller = nextController;

  debounceTimer = setTimeout(async () => {
    debounceTimer = undefined;
    const requestId = ++requestSequence.value;
    requestState.value = `请求 #${requestId}：${normalized}`;

    try {
      const nextResults = await searchCatalog(normalized, nextController.signal);
      if (requestGeneration !== generation) {
        ignoredResponses.value += 1;
        return;
      }

      results.value = nextResults;
      requestState.value = `请求 #${requestId} 已提交 ${nextResults.length} 条结果`;
    } catch (reason) {
      if (requestGeneration !== generation || nextController.signal.aborted) return;
      error.value = reason instanceof Error ? reason.message : "结果服务暂时不可用";
      results.value = [];
      requestState.value = `请求 #${requestId} 失败`;
    } finally {
      if (requestGeneration === generation) loading.value = false;
    }
  }, 140);
}

async function runOutOfOrderFixture(): Promise<void> {
  if (raceTimer !== undefined) clearTimeout(raceTimer);
  value.value = null;
  query.value = "";
  await nextTick();
  query.value = "a";
  raceTimer = setTimeout(() => {
    raceTimer = undefined;
    query.value = "ab";
  }, 180);
}

watch(query, scheduleSearch, { immediate: true });

onBeforeUnmount(() => {
  generation += 1;
  controller?.abort();
  if (debounceTimer !== undefined) clearTimeout(debounceTimer);
  if (raceTimer !== undefined) clearTimeout(raceTimer);
  for (const timer of transportTimers) clearTimeout(timer);
  transportTimers.clear();
});
</script>

<template>
  <div>
    <Combobox
      :id="`async-combobox-${props.tone}`"
      v-model="value"
      v-model:query="query"
      label="异步搜索文档"
      placeholder="输入标题或主题"
      :options="results"
      :loading="loading"
      :error="error"
      loading-label="正在查询文档"
      empty-label="没有匹配文档"
      clearable
      block
      panel-class="w-80"
    />
    <p class="mt-2 text-xs/5 text-fg-muted">{{ statusText }}</p>
    <ButtonTertiary text="运行 A → AB 乱序" class="mt-1 -ml-2" @click="runOutOfOrderFixture" />
    <p class="mt-1 text-xs/5 text-fg-soft">
      按钮会稳定产生晚到响应；输入
      <code class="font-mono text-fg">error</code> 验证失败反馈。
    </p>
  </div>
</template>
