<!-- src/views/inputs/Inputs.page.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";

import InputField from "@/components/input/InputField.vue";
import InputNumber from "@/components/input/InputNumber.vue";
import InputPassword from "@/components/input/InputPassword.vue";
import InputSearch from "@/components/input/InputSearch.vue";
import InputText from "@/components/input/InputText.vue";
import InputTextarea from "@/components/input/InputTextarea.vue";
import HelpTooltip from "@/components/overlay/HelpTooltip.vue";

import SpecimenPair from "../components/SpecimenPair.vue";

const username = ref("");
const password = ref("ohmyblog-demo");
const excerpt = ref("组件只负责多行文本输入，校验与计数由字段层组合。");
const smtpPort = ref<number | null>(587);
const recaptchaMinScore = ref<number | null>(0.5);
const postSlug = ref("yong4-docker-bu4-shu3");
const searchQuery = ref("输入组件");
const lastSearch = ref<string | null>(null);

const EXCERPT_MAX_LENGTH = 120;
const excerptRemaining = computed(() => EXCERPT_MAX_LENGTH - excerpt.value.length);
const searchEventLabel = computed(() =>
  lastSearch.value === null ? "尚未触发" : `search(${JSON.stringify(lastSearch.value)})`,
);

const handleSearch = (value: string) => {
  lastSearch.value = value;
};

const INPUT_TEXT_PROPS = [
  ["modelValue", "string", '""', "输入值；prefix / suffix 不会写入模型"],
  [
    "type",
    '"text" | "email" | "password" | "search" | "tel" | "url"',
    '"text"',
    "文本型原生 input 类型",
  ],
  ["disabled", "boolean", "false", "原生禁用状态"],
  ["readonly", "boolean", "false", "原生只读状态"],
  ["required", "boolean", "false", "原生必填状态"],
  ["invalid", "boolean", "false", "错误视觉与 aria-invalid"],
  ["inputClass", "HTMLAttributes['class']", "未传", "直接调整内部原生 input"],
  ["#prefix", "slot", "—", "输入区域前置内容，不进入 modelValue"],
  ["#suffix", "slot", "—", "输入区域尾部内容，不进入 modelValue"],
] as const;

const INPUT_PASSWORD_PROPS = [
  ["disabled", "boolean", "false", "禁用输入框与显隐按钮，并恢复密文"],
  ["readonly", "boolean", "false", "只读状态保持密文且不显示显隐按钮"],
  ["required", "boolean", "false", "原生必填状态"],
  ["invalid", "boolean", "false", "错误视觉与 aria-invalid"],
  ["inputClass", "HTMLAttributes['class']", "未传", "直接调整内部原生 input"],
  ["showPasswordLabel", "string", '"显示密码"', "密文状态下按钮的无障碍名称"],
  ["hidePasswordLabel", "string", '"隐藏密码"', "明文状态下按钮的无障碍名称"],
] as const;

const INPUT_TEXTAREA_PROPS = [
  ["rows", "number", "4", "原生 textarea 可见行数"],
  ["resize", '"none" | "vertical"', '"none"', "是否允许垂直调整高度"],
  ["disabled", "boolean", "false", "原生禁用状态"],
  ["readonly", "boolean", "false", "原生只读状态"],
  ["required", "boolean", "false", "原生必填状态"],
  ["invalid", "boolean", "false", "错误视觉与 aria-invalid"],
  ["textareaClass", "HTMLAttributes['class']", "未传", "直接调整内部原生 textarea"],
] as const;

const INPUT_NUMBER_PROPS = [
  ["modelValue", "number | null", "null", "合法数字或空值"],
  ["min", "number", "未传", "原生最小值，不自动截断"],
  ["max", "number", "未传", "原生最大值，不自动截断"],
  ["step", 'number | "any"', "1", "原生步进规则"],
  ["disabled", "boolean", "false", "原生禁用状态"],
  ["readonly", "boolean", "false", "原生只读状态"],
  ["required", "boolean", "false", "原生必填状态"],
  ["invalid", "boolean", "false", "错误视觉与 aria-invalid"],
  ["inputClass", "HTMLAttributes['class']", "未传", "直接调整内部原生 input"],
] as const;

const INPUT_SEARCH_API = [
  ["modelValue", "string", '""', "搜索关键字"],
  ["width", "HTMLAttributes['class']", '"max-w-56"', "完整搜索框的宽度 class"],
  ["disabled", "boolean", "false", "禁用输入与清空按钮"],
  ["readonly", "boolean", "false", "只读输入并隐藏清空按钮"],
  ["required", "boolean", "false", "原生必填状态"],
  ["invalid", "boolean", "false", "错误视觉与 aria-invalid"],
  ["inputClass", "HTMLAttributes['class']", "未传", "直接调整内部原生 input"],
  ["clearLabel", "string", '"清空搜索"', "清空按钮的 title 与无障碍名称"],
  ["@search", "(value: string) => void", "—", "按 Enter 或清空时触发"],
] as const;

const INPUT_FIELD_PROPS = [
  ["id", "string", "自动生成", "原生控件 id 与 label for"],
  ["label", "string", "未传", "字段标题"],
  ["description", "string", "未传", "辅助说明；description slot 可覆盖"],
  ["error", "string", "未传", "错误文案并关联 aria-errormessage"],
  ["required", "boolean", "false", "显示必填标记并传给控件"],
  ["disabled", "boolean", "false", "传递原生禁用状态"],
  ["#label", "slot", "—", "自定义字段标题内容"],
  ["#hint", "slot", "—", "标题右侧内容，可组合 HelpTooltip"],
  ["#description", "slot", "—", "自定义辅助说明并保持 ARIA 关联"],
] as const;
</script>

<template>
  <div>
    <p class="max-w-xl text-sm/6 text-fg-muted">
      每个输入组件都按状态样例与 Props
      就地展示。浅色和深色使用相同数据，方便直接比较交互、错误与受限状态。
    </p>

    <section class="mt-10">
      <h2 class="font-mono text-sm text-fg">InputText</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-fg-muted">
        InputText 负责真实输入控件、原生属性与焦点状态。以下样例使用 InputField
        提供标签和错误语义，调用方的
        <code class="font-mono text-fg">class</code>
        仍作用于完整输入框外壳；
        <code class="font-mono text-fg">prefix</code>
        与
        <code class="font-mono text-fg">suffix</code>
        slots 只扩展输入区域，不会改变 modelValue。
      </p>

      <SpecimenPair class="mt-6">
        <p class="mt-4 font-mono text-xs text-fg-subtle">可编辑状态</p>
        <div class="mt-2 space-y-5">
          <InputField label="用户名" required>
            <template #default="{ controlAttrs }">
              <InputText
                v-bind="controlAttrs"
                v-model="username"
                autocomplete="off"
                placeholder="请输入用户名"
              />
            </template>
          </InputField>

          <InputField label="用户名" required error="用户名不能为空">
            <template #default="{ controlAttrs }">
              <InputText v-bind="controlAttrs" placeholder="请输入用户名" />
            </template>
          </InputField>
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">静态前缀与字段提示</p>
        <div class="mt-2">
          <InputField required>
            <template #label>
              <span class="inline-flex items-center gap-1.5 text-accent">
                <svg
                  aria-hidden="true"
                  class="size-4 shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <path
                    d="M13.0607 8.11097L14.4749 9.52518C17.2086 12.2589 17.2086 16.691 14.4749 19.4247L14.1214 19.7782C11.3877 22.5119 6.95555 22.5119 4.22188 19.7782C1.48821 17.0446 1.48821 12.6124 4.22188 9.87874L5.6361 11.293C3.68348 13.2456 3.68348 16.4114 5.6361 18.364C7.58872 20.3166 10.7545 20.3166 12.7072 18.364L13.0607 18.0105C15.0133 16.0578 15.0133 12.892 13.0607 10.9394L11.6465 9.52518L13.0607 8.11097ZM19.7782 14.1214L18.364 12.7072C20.3166 10.7545 20.3166 7.58872 18.364 5.6361C16.4114 3.68348 13.2456 3.68348 11.293 5.6361L10.9394 5.98965C8.98678 7.94227 8.98678 11.1081 10.9394 13.0607L12.3536 14.4749L10.9394 15.8891L9.52518 14.4749C6.79151 11.7413 6.79151 7.30911 9.52518 4.57544L9.87874 4.22188C12.6124 1.48821 17.0446 1.48821 19.7782 4.22188C22.5119 6.95555 22.5119 11.3877 19.7782 14.1214Z"
                  />
                </svg>
                <span>永久连接</span>
              </span>
            </template>

            <template #hint>
              <HelpTooltip
                label="查看永久连接说明"
                content="将根据标题自动填写，你也可以手动修改；发布前不能为空。"
              />
            </template>

            <template #default="{ controlAttrs }">
              <InputText
                v-bind="controlAttrs"
                v-model="postSlug"
                autocomplete="off"
                spellcheck="false"
                aria-label="永久连接，固定前缀 /posts/"
                placeholder="post-slug"
                input-class="min-w-0 font-mono font-normal"
              >
                <template #prefix>
                  <span
                    aria-hidden="true"
                    class="flex min-h-10 shrink-0 items-center border-r border-border/60 bg-bg px-3 font-mono text-xs text-fg-muted select-none"
                  >
                    /posts/
                  </span>
                </template>
              </InputText>
            </template>
          </InputField>
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">受限状态</p>
        <div class="mt-2 space-y-5">
          <InputField label="站点地址">
            <template #default="{ controlAttrs }">
              <InputText v-bind="controlAttrs" model-value="https://ohmy.blog" readonly />
            </template>
          </InputField>

          <InputField label="不可编辑" disabled>
            <template #default="{ controlAttrs }">
              <InputText v-bind="controlAttrs" model-value="禁用状态" />
            </template>
          </InputField>
        </div>
      </SpecimenPair>

      <div class="mt-6 overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left font-mono text-xs">
          <caption class="sr-only">
            InputText Props and Slots
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
            <tr v-for="row in INPUT_TEXT_PROPS" :key="row[0]" class="text-fg-muted">
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
      <h2 class="font-mono text-sm text-fg">InputPassword</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-fg-muted">
        InputPassword 在 InputText 上组合 password/text 切换和显隐按钮。点击按钮不会让输入框失焦；
        <code class="font-mono text-fg">show-icon</code>
        与
        <code class="font-mono text-fg">hide-icon</code>
        slots 可覆盖默认图标。
      </p>

      <SpecimenPair class="mt-6">
        <p class="mt-4 font-mono text-xs text-fg-subtle">显隐与错误</p>
        <div class="mt-2 space-y-5">
          <InputField label="密码" required>
            <template #default="{ controlAttrs }">
              <InputPassword
                v-bind="controlAttrs"
                v-model="password"
                autocomplete="off"
                placeholder="请输入密码"
              />
            </template>
          </InputField>

          <InputField label="密码" required error="密码至少需要 8 个字符">
            <template #default="{ controlAttrs }">
              <InputPassword
                v-bind="controlAttrs"
                model-value="123"
                autocomplete="off"
                placeholder="请输入密码"
              />
            </template>
          </InputField>
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">受限状态</p>
        <div class="mt-2 space-y-5">
          <InputField label="只读密码">
            <template #default="{ controlAttrs }">
              <InputPassword
                v-bind="controlAttrs"
                model-value="readonly-secret"
                autocomplete="off"
                readonly
              />
            </template>
          </InputField>

          <InputField label="禁用密码" disabled>
            <template #default="{ controlAttrs }">
              <InputPassword
                v-bind="controlAttrs"
                model-value="disabled-secret"
                autocomplete="off"
              />
            </template>
          </InputField>
        </div>
      </SpecimenPair>

      <div class="mt-6 overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left font-mono text-xs">
          <caption class="sr-only">
            InputPassword Props
          </caption>
          <thead>
            <tr class="text-fg-muted">
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">prop</th>
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">类型</th>
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">默认</th>
              <th scope="col" class="border-b border-border/60 py-2 font-normal">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in INPUT_PASSWORD_PROPS" :key="row[0]" class="text-fg-muted">
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
      <h2 class="font-mono text-sm text-fg">InputTextarea</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-fg-muted">
        InputTextarea 与 InputText 共用输入外壳，只负责原生多行文本能力。maxlength
        等原生属性直接落到
        <code class="font-mono text-fg">textarea</code>
        ，字数计数和校验由 InputField 或业务层组合。
      </p>

      <SpecimenPair class="mt-6">
        <p class="mt-4 font-mono text-xs text-fg-subtle">多行与字数</p>
        <div class="mt-2 space-y-5">
          <InputField label="文章摘要" required>
            <template #default="{ controlAttrs }">
              <InputTextarea
                v-bind="controlAttrs"
                v-model="excerpt"
                :maxlength="EXCERPT_MAX_LENGTH"
                autocomplete="off"
                placeholder="请输入文章摘要"
              />
            </template>
            <template #description>
              <span class="block text-right">
                {{ excerptRemaining }} / {{ EXCERPT_MAX_LENGTH }}
              </span>
            </template>
          </InputField>

          <InputField label="拒绝原因" required error="请至少输入 20 个字符">
            <template #default="{ controlAttrs }">
              <InputTextarea
                v-bind="controlAttrs"
                model-value="内容太短"
                autocomplete="off"
                placeholder="请输入拒绝原因"
              />
            </template>
          </InputField>
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">受限状态</p>
        <div class="mt-2 space-y-5">
          <InputField label="只读内容">
            <template #default="{ controlAttrs }">
              <InputTextarea
                v-bind="controlAttrs"
                model-value="这段内容仅供查看，不能在当前状态下修改。"
                :rows="3"
                readonly
              />
            </template>
          </InputField>

          <InputField label="禁用内容" disabled>
            <template #default="{ controlAttrs }">
              <InputTextarea v-bind="controlAttrs" model-value="当前字段不可编辑。" :rows="3" />
            </template>
          </InputField>
        </div>
      </SpecimenPair>

      <div class="mt-6 overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left font-mono text-xs">
          <caption class="sr-only">
            InputTextarea Props
          </caption>
          <thead>
            <tr class="text-fg-muted">
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">prop</th>
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">类型</th>
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">默认</th>
              <th scope="col" class="border-b border-border/60 py-2 font-normal">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in INPUT_TEXTAREA_PROPS" :key="row[0]" class="text-fg-muted">
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
      <h2 class="font-mono text-sm text-fg">InputNumber</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-fg-muted">
        InputNumber 保留原生 number 控件，并将外部模型稳定为
        <code class="font-mono text-fg">number | null</code>
        。min、max 与 step 只声明原生约束，范围错误和提示仍由 InputField 或业务层决定。
      </p>

      <SpecimenPair class="mt-6">
        <p class="mt-4 font-mono text-xs text-fg-subtle">整数、小数与空值</p>
        <div class="mt-2 space-y-5">
          <InputField label="SMTP 端口" required>
            <template #default="{ controlAttrs }">
              <InputNumber
                v-bind="controlAttrs"
                v-model="smtpPort"
                :min="1"
                :max="65535"
                autocomplete="off"
                placeholder="587"
              />
            </template>
            <template #description>
              <span class="flex items-center justify-between gap-3">
                <span>范围 1–65535</span>
                <span class="font-mono">model: {{ smtpPort ?? "null" }}</span>
              </span>
            </template>
          </InputField>

          <InputField label="最低分数" description="范围 0–1，步长 0.1">
            <template #default="{ controlAttrs }">
              <InputNumber
                v-bind="controlAttrs"
                v-model="recaptchaMinScore"
                :min="0"
                :max="1"
                :step="0.1"
                autocomplete="off"
                placeholder="0.5"
              />
            </template>
          </InputField>
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">错误与受限状态</p>
        <div class="mt-2 space-y-5">
          <InputField label="SMTP 端口" required error="端口必须在 1–65535 之间">
            <template #default="{ controlAttrs }">
              <InputNumber v-bind="controlAttrs" :model-value="70000" :min="1" :max="65535" />
            </template>
          </InputField>

          <InputField label="只读编号">
            <template #default="{ controlAttrs }">
              <InputNumber v-bind="controlAttrs" :model-value="42" readonly />
            </template>
          </InputField>

          <InputField label="禁用数值" disabled>
            <template #default="{ controlAttrs }">
              <InputNumber v-bind="controlAttrs" :model-value="0" />
            </template>
          </InputField>
        </div>
      </SpecimenPair>

      <div class="mt-6 overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left font-mono text-xs">
          <caption class="sr-only">
            InputNumber Props
          </caption>
          <thead>
            <tr class="text-fg-muted">
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">prop</th>
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">类型</th>
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">默认</th>
              <th scope="col" class="border-b border-border/60 py-2 font-normal">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in INPUT_NUMBER_PROPS" :key="row[0]" class="text-fg-muted">
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
      <h2 class="font-mono text-sm text-fg">InputSearch</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-fg-muted">
        InputSearch 在 InputText 上组合原生 search
        类型、搜索与清空动作，不包含请求、结果或导航等业务逻辑。默认保持紧凑宽度；
        <code class="font-mono text-fg">search-icon</code>
        、
        <code class="font-mono text-fg">clear-icon</code>
        与
        <code class="font-mono text-fg">suffix</code>
        slots 可覆盖或扩展图标区域。
      </p>

      <SpecimenPair class="mt-6">
        <p class="mt-4 font-mono text-xs text-fg-subtle">默认宽度与 search 事件</p>
        <div class="mt-2 space-y-5">
          <InputField label="文章搜索">
            <template #default="{ controlAttrs }">
              <InputSearch
                v-bind="controlAttrs"
                v-model="searchQuery"
                autocomplete="off"
                placeholder="搜索文章"
                @search="handleSearch"
              />
            </template>
            <template #description>
              <span class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span>按 Enter 搜索；清空会传递空字符串</span>
                <span aria-live="polite" class="font-mono text-fg-subtle">
                  {{ searchEventLabel }}
                </span>
              </span>
            </template>
          </InputField>

          <InputField label="弹窗搜索" description='width="max-w-none" 可占满所在容器。'>
            <template #default="{ controlAttrs }">
              <InputSearch
                v-bind="controlAttrs"
                width="max-w-none"
                autocomplete="off"
                placeholder="搜索站内内容"
                @search="handleSearch"
              />
            </template>
          </InputField>
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">受限状态</p>
        <div class="mt-2 space-y-5">
          <InputField label="只读搜索">
            <template #default="{ controlAttrs }">
              <InputSearch v-bind="controlAttrs" model-value="固定关键词" readonly />
            </template>
          </InputField>

          <InputField label="禁用搜索" disabled>
            <template #default="{ controlAttrs }">
              <InputSearch v-bind="controlAttrs" model-value="不可搜索" />
            </template>
          </InputField>
        </div>
      </SpecimenPair>

      <div class="mt-6 overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left font-mono text-xs">
          <caption class="sr-only">
            InputSearch Props and Events
          </caption>
          <thead>
            <tr class="text-fg-muted">
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">
                prop / event
              </th>
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">类型</th>
              <th scope="col" class="border-b border-border/60 py-2 pr-4 font-normal">默认</th>
              <th scope="col" class="border-b border-border/60 py-2 font-normal">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in INPUT_SEARCH_API" :key="row[0]" class="text-fg-muted">
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
      <h2 class="font-mono text-sm text-fg">InputField</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-fg-muted">
        InputField 只组织字段语义：它连接 label、辅助说明、错误文案与真实控件，并通过默认 slot
        下发所需的原生属性。
        <code class="font-mono text-fg">hint</code>
        slot 只提供标题后的组合位置，HelpTooltip 仍是独立的浮层组件。
      </p>

      <SpecimenPair class="mt-6">
        <p class="mt-4 font-mono text-xs text-fg-subtle">说明与错误关联</p>
        <div class="mt-2 space-y-5">
          <InputField label="邮箱地址" description="用于接收登录提醒，不会公开展示。" required>
            <template #default="{ controlAttrs }">
              <InputText
                v-bind="controlAttrs"
                type="email"
                autocomplete="off"
                placeholder="name@example.com"
              />
            </template>
          </InputField>

          <InputField
            label="站点地址"
            description="请输入包含协议的完整地址。"
            error="地址必须以 https:// 开头"
          >
            <template #default="{ controlAttrs }">
              <InputText v-bind="controlAttrs" type="url" model-value="ohmy.blog" />
            </template>
          </InputField>
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">标签插槽与禁用</p>
        <div class="mt-2">
          <InputField description="此字段由账户系统统一管理。" disabled>
            <template #label>账户标识</template>
            <template #hint>
              <span
                class="font-mono text-[10px] font-normal tracking-normal text-fg-soft normal-case"
              >
                系统管理
              </span>
            </template>
            <template #default="{ controlAttrs }">
              <InputText v-bind="controlAttrs" model-value="user-001" />
            </template>
          </InputField>
        </div>
      </SpecimenPair>

      <div class="mt-6 overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left font-mono text-xs">
          <caption class="sr-only">
            InputField Props and Slots
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
            <tr v-for="row in INPUT_FIELD_PROPS" :key="row[0]" class="text-fg-muted">
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
