<!-- src/views/inputs/Inputs.page.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";

import InputField from "@/components/input/InputField.vue";
import InputPassword from "@/components/input/InputPassword.vue";
import InputText from "@/components/input/InputText.vue";
import InputTextarea from "@/components/input/InputTextarea.vue";

import SpecimenPair from "../components/SpecimenPair.vue";

const username = ref("");
const password = ref("ohmyblog-demo");
const excerpt = ref("组件只负责多行文本输入，校验与计数由字段层组合。");

const EXCERPT_MAX_LENGTH = 120;
const excerptRemaining = computed(() => EXCERPT_MAX_LENGTH - excerpt.value.length);

const INPUT_TEXT_PROPS = [
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

const INPUT_FIELD_PROPS = [
  ["id", "string", "自动生成", "原生控件 id 与 label for"],
  ["label", "string", "未传", "字段标题"],
  ["description", "string", "未传", "辅助说明；description slot 可覆盖"],
  ["error", "string", "未传", "错误文案并关联 aria-errormessage"],
  ["required", "boolean", "false", "显示必填标记并传给控件"],
  ["disabled", "boolean", "false", "传递原生禁用状态"],
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
        仍作用于完整输入框外壳。
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
            InputText Props
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
      <h2 class="font-mono text-sm text-fg">InputField</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-fg-muted">
        InputField 只组织字段语义：它连接 label、辅助说明、错误文案与真实控件，并通过默认 slot
        下发所需的原生属性。
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
            InputField Props
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
