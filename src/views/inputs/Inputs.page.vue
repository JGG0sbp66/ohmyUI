<!-- src/views/inputs/Inputs.page.vue -->
<script setup lang="ts">
import { ref } from "vue";

import InputField from "@/components/input/InputField.vue";
import InputPassword from "@/components/input/InputPassword.vue";
import InputText from "@/components/input/InputText.vue";

import SpecimenPair from "../components/SpecimenPair.vue";

const username = ref("");
const password = ref("ohmyblog-demo");

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

const INPUT_FIELD_PROPS = [
  ["id", "string", "自动生成", "原生控件 id 与 label for"],
  ["label", "string", "未传", "字段标题"],
  ["description", "string", "未传", "辅助说明并关联 aria-describedby"],
  ["error", "string", "未传", "错误文案并关联 aria-errormessage"],
  ["required", "boolean", "false", "显示必填标记并传给控件"],
  ["disabled", "boolean", "false", "传递原生禁用状态"],
] as const;
</script>

<template>
  <div>
    <p class="max-w-xl text-sm/6 text-fg-muted">
      输入框按职责拆成 Field、基础文本控件和密码组合层。外观保持原有 TipInput
      的圆角、背景、间距与状态，标签、错误语义和密码显隐互不耦合。
    </p>

    <section class="mt-10">
      <h2 class="font-mono text-sm text-fg">InputText + InputField</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-fg-muted">
        输入值、原生属性和事件落在真正的
        <code class="font-mono text-fg">input</code>
        上；调用方的
        <code class="font-mono text-fg">class</code>
        仍作用于完整外壳。
      </p>

      <SpecimenPair class="mt-6">
        <div class="mt-4 space-y-5">
          <InputField label="用户名" required>
            <template #default="{ controlAttrs }">
              <InputText
                v-bind="controlAttrs"
                v-model="username"
                name="username-preview"
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
    </section>

    <section class="mt-12">
      <h2 class="font-mono text-sm text-fg">InputPassword + InputField</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-fg-muted">
        InputPassword 内部组合 InputText，只增加 password/text
        切换和显隐按钮。点击按钮不会让输入框失焦；
        <code class="font-mono text-fg">show-icon</code>
        与
        <code class="font-mono text-fg">hide-icon</code>
        slots 可覆盖默认图标。
      </p>

      <SpecimenPair class="mt-6">
        <div class="mt-4 space-y-5">
          <InputField label="密码" required>
            <template #default="{ controlAttrs }">
              <InputPassword
                v-bind="controlAttrs"
                v-model="password"
                name="password-preview"
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
    </section>

    <section class="mt-12">
      <h2 class="font-mono text-sm text-fg">InputText API</h2>
      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left font-mono text-xs">
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

    <section class="mt-12">
      <h2 class="font-mono text-sm text-fg">InputPassword API</h2>
      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left font-mono text-xs">
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

    <section class="mt-12">
      <h2 class="font-mono text-sm text-fg">InputField API</h2>
      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-160 border-collapse text-left font-mono text-xs">
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
