<!-- src/views/buttons/Buttons.page.vue -->
<!-- 按钮类组件展示。新增组件时加一个 <section>，并往 PROPS 里补一份签名 -->
<script setup lang="ts">
import { ref } from "vue";

import ButtonPrimary from "@/components/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/button/ButtonSecondary.vue";
import IconButton from "@/components/button/IconButton.vue";

import SpecimenPair from "../components/SpecimenPair.vue";
import PreviewIcon from "./components/PreviewIcon.vue";

/** 手动切换才能看清加载指示器进出的宽度过渡 */
const loadingDemo = ref(false);

const ICON = {
  plus: "M12 5v14M5 12h14",
  check: "m5 13 4 4L19 7",
  close: "M18 6 6 18M6 6l12 12",
  menu: "M4 6h16M4 12h16M4 18h16",
} as const;

const PROPS = {
  ButtonPrimary: [
    ["text", "string", "必填", "按钮文字"],
    ["loading", "boolean", "false", "显示指示器并禁用点击"],
    ["disabled", "boolean", "false", "禁用"],
    ["danger", "boolean", "false", "破坏性操作，底色换成危险色"],
    ["block", "boolean", "false", "撑满父容器宽度"],
    ["type", '"button" | "submit" | "reset"', '"button"', "表单场景传 submit"],
  ],
  ButtonSecondary: [
    ["text", "string", "必填", "按钮文字。纯图标场景用 IconButton"],
    ["isActive", "boolean", "false", "激活态，背景层常显"],
    ["disabled", "boolean", "false", "禁用"],
    ["block", "boolean", "false", "撑满父容器宽度"],
    ["align", '"center" | "start"', '"center"', "内容对齐，菜单项用 start"],
  ],
  IconButton: [
    ["label", "string", "必填", "无障碍名称，渲染为 aria-label"],
    ["isActive", "boolean", "false", "激活态，背景层常显"],
    ["disabled", "boolean", "false", "禁用"],
  ],
} as const;
</script>

<template>
  <div>
    <p class="max-w-xl text-sm/6 text-zinc-400">
      两个组件都只输出内在样式（内边距、字号、圆角、颜色、过渡），不输出宽高 ——
      布局由上下文决定，留给调用方，所以传
      <code class="font-mono text-zinc-300">h-11</code> 之类不需要
      <code class="font-mono text-zinc-300">!</code>。
    </p>

    <!-- ButtonPrimary -->
    <section class="mt-10">
      <h2 class="font-mono text-sm text-zinc-100">ButtonPrimary</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-zinc-400">
        实心强调色主按钮。加载中显示指示器并自动禁用点击，指示器的宽度与透明度同步过渡。
      </p>

      <SpecimenPair class="mt-6">
        <p class="mt-4 font-mono text-xs text-fg-subtle">状态</p>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <ButtonPrimary text="默认" />
          <ButtonPrimary text="加载中" loading />
          <ButtonPrimary text="禁用" disabled />
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">切换加载态（看宽度过渡）</p>
        <div class="mt-2 flex items-center gap-2">
          <ButtonPrimary
            text="保存"
            :loading="loadingDemo"
            class="min-w-24"
            @click="loadingDemo = !loadingDemo"
          />
          <ButtonSecondary text="切回来" @click="loadingDemo = !loadingDemo" />
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">danger</p>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <ButtonPrimary text="删除" danger />
          <ButtonPrimary text="删除中" danger loading />
          <ButtonPrimary text="不可删除" danger disabled />
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">block</p>
        <div class="mt-2">
          <ButtonPrimary text="全宽" block />
        </div>
      </SpecimenPair>

      <table class="mt-6 w-full border-collapse text-left font-mono text-xs">
        <thead>
          <tr class="text-zinc-500">
            <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">prop</th>
            <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">类型</th>
            <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">默认</th>
            <th scope="col" class="border-b border-zinc-800 py-2 font-normal">说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in PROPS.ButtonPrimary" :key="row[0]" class="text-zinc-400">
            <td class="border-b border-zinc-900 py-2.5 pr-4 text-zinc-100">{{ row[0] }}</td>
            <td class="border-b border-zinc-900 py-2.5 pr-4">{{ row[1] }}</td>
            <td class="border-b border-zinc-900 py-2.5 pr-4">{{ row[2] }}</td>
            <td class="border-b border-zinc-900 py-2.5">{{ row[3] }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ButtonSecondary -->
    <section class="mt-16">
      <h2 class="font-mono text-sm text-zinc-100">ButtonSecondary</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-zinc-400">
        纯文字按钮，可带前置图标与尾部内容。背景层是独立缩放的
        <code class="font-mono">::before</code>，hover 时从 90% 弹到 100%。
      </p>

      <SpecimenPair class="mt-6">
        <p class="mt-4 font-mono text-xs text-fg-subtle">状态</p>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <ButtonSecondary text="默认" />
          <ButtonSecondary text="激活" is-active />
          <ButtonSecondary text="禁用" disabled />
          <ButtonSecondary text="带图标">
            <PreviewIcon :d="ICON.plus" />
          </ButtonSecondary>
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">block + align</p>
        <div class="mt-2 space-y-1">
          <ButtonSecondary text="全宽居中" block />
          <ButtonSecondary text="全宽左对齐" block align="start">
            <PreviewIcon :d="ICON.menu" />
          </ButtonSecondary>
          <ButtonSecondary text="带尾部内容" block align="start">
            <template #suffix>
              <PreviewIcon :d="ICON.check" />
            </template>
          </ButtonSecondary>
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">调用方控制布局</p>
        <div class="mt-2 flex items-center gap-2">
          <ButtonSecondary text="h-11" class="h-11" />
          <ButtonSecondary text="圆角跟随" class="rounded-full" />
        </div>
      </SpecimenPair>

      <table class="mt-6 w-full border-collapse text-left font-mono text-xs">
        <thead>
          <tr class="text-zinc-500">
            <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">prop</th>
            <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">类型</th>
            <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">默认</th>
            <th scope="col" class="border-b border-zinc-800 py-2 font-normal">说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in PROPS.ButtonSecondary" :key="row[0]" class="text-zinc-400">
            <td class="border-b border-zinc-900 py-2.5 pr-4 text-zinc-100">{{ row[0] }}</td>
            <td class="border-b border-zinc-900 py-2.5 pr-4">{{ row[1] }}</td>
            <td class="border-b border-zinc-900 py-2.5 pr-4">{{ row[2] }}</td>
            <td class="border-b border-zinc-900 py-2.5">{{ row[3] }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- IconButton -->
    <section class="mt-16">
      <h2 class="font-mono text-sm text-zinc-100">IconButton</h2>
      <p class="mt-2 max-w-xl text-sm/6 text-zinc-400">
        纯图标按钮，宽高 1:1。靠
        <code class="font-mono">aspect-square</code>
        保证，图标不是正方形也不影响。视觉语言与 ButtonSecondary 一致。
      </p>

      <SpecimenPair class="mt-6">
        <p class="mt-4 font-mono text-xs text-fg-subtle">状态</p>
        <div class="mt-2 flex items-center gap-2">
          <IconButton label="添加">
            <PreviewIcon :d="ICON.plus" />
          </IconButton>
          <IconButton label="已选中" is-active>
            <PreviewIcon :d="ICON.check" />
          </IconButton>
          <IconButton label="不可用" disabled>
            <PreviewIcon :d="ICON.close" />
          </IconButton>
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">扁图标仍为 1:1</p>
        <div class="mt-2 flex items-center gap-2">
          <IconButton label="菜单">
            <svg
              class="h-2 w-5"
              viewBox="0 0 24 12"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M2 3h20M2 9h20" stroke-linecap="round" />
            </svg>
          </IconButton>
        </div>

        <p class="mt-5 font-mono text-xs text-fg-subtle">调用方指定尺寸与圆角</p>
        <div class="mt-2 flex items-center gap-2">
          <IconButton label="大号圆形" class="size-10 rounded-full">
            <PreviewIcon :d="ICON.plus" />
          </IconButton>
        </div>
      </SpecimenPair>

      <table class="mt-6 w-full border-collapse text-left font-mono text-xs">
        <thead>
          <tr class="text-zinc-500">
            <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">prop</th>
            <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">类型</th>
            <th scope="col" class="border-b border-zinc-800 py-2 pr-4 font-normal">默认</th>
            <th scope="col" class="border-b border-zinc-800 py-2 font-normal">说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in PROPS.IconButton" :key="row[0]" class="text-zinc-400">
            <td class="border-b border-zinc-900 py-2.5 pr-4 text-zinc-100">{{ row[0] }}</td>
            <td class="border-b border-zinc-900 py-2.5 pr-4">{{ row[1] }}</td>
            <td class="border-b border-zinc-900 py-2.5 pr-4">{{ row[2] }}</td>
            <td class="border-b border-zinc-900 py-2.5">{{ row[3] }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
