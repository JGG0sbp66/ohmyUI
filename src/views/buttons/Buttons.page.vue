<!-- src/views/buttons/Buttons.page.vue -->
<!-- 按钮类组件展示。新增组件时加一个 <ComponentDocsSection>，并往 PROPS 里补一份签名 -->
<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  FilePlus2,
  Maximize2,
  Menu,
  Plus,
  Settings,
  Trash2,
} from "@lucide/vue";
import { ref } from "vue";

import ButtonIcon from "@/components/button/ButtonIcon.vue";
import ButtonPrimary from "@/components/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/button/ButtonSecondary.vue";
import ButtonThird from "@/components/button/ButtonThird.vue";

import ApiTable from "../components/ApiTable.vue";
import ComponentDocsSection from "../components/ComponentDocsSection.vue";
import SpecimenCase from "../components/SpecimenCase.vue";
import SpecimenPair from "../components/SpecimenPair.vue";

/** 手动切换才能看清加载指示器进出的宽度过渡 */
const loadingDemo = ref(false);

const PROPS = {
  ButtonPrimary: [
    ["text", "string", "必填", "按钮文字"],
    ["loading", "boolean", "false", "显示指示器并禁用点击"],
    ["loadingLabel", "string", '"加载中"', "loading 状态的读屏提示文本"],
    ["disabled", "boolean", "false", "禁用"],
    ["danger", "boolean", "false", "破坏性操作，底色换成危险色"],
    ["block", "boolean", "false", "撑满父容器宽度"],
    ["type", '"button" | "submit" | "reset"', '"button"', "表单场景传 submit"],
  ],
  ButtonSecondary: [
    ["text", "string", "必填", "按钮文字。纯图标场景用 ButtonIcon"],
    ["isActive", "boolean", "false", "激活态，背景层常显"],
    ["disabled", "boolean", "false", "禁用"],
    ["block", "boolean", "false", "撑满父容器宽度"],
    ["align", '"center" | "start"', '"center"', "内容对齐，菜单项用 start"],
  ],
  ButtonThird: [
    ["text", "string", "必填", "按钮文字。纯图标场景用 ButtonIcon"],
    ["isActive", "boolean", "未传", "可选切换态；传入时同步 aria-pressed"],
    ["disabled", "boolean", "false", "禁用"],
    ["danger", "boolean", "false", "低强调破坏性操作"],
    ["href", "string", "未传", "外链地址，传入后默认渲染成 a"],
    ["target", "string", "未传", "外链 target"],
    ["rel", "string", "未传", "外链 rel"],
    ["as", "string | Component", "未传", "覆盖渲染标签，站内跳转传 RouterLink"],
    ["type", '"button" | "submit" | "reset"', '"button"', "仅渲染 button 时生效"],
    ["default", "slot", "—", "文字前的图标"],
    ["suffix", "slot", "—", "文字后的尾随内容"],
  ],
  ButtonIcon: [
    ["label", "string", "必填", "无障碍名称，渲染为 aria-label"],
    ["isActive", "boolean", "false", "激活态，背景层常显"],
    ["disabled", "boolean", "false", "禁用"],
  ],
} as const;
</script>

<template>
  <div>
    <p class="max-w-xl text-sm/6 text-fg-muted">
      这一页的组件都只输出内在样式（内边距、字号、圆角、颜色、过渡），不输出宽高 ——
      布局由上下文决定，留给调用方，所以传
      <code class="font-mono text-fg">h-11</code> 之类不需要
      <code class="font-mono text-fg">!</code>。
    </p>

    <!-- ButtonPrimary -->
    <ComponentDocsSection title="ButtonPrimary" class="mt-10">
      <template #description>
        实心强调色主按钮。加载中显示指示器并自动禁用点击，指示器的宽度与透明度同步过渡。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="状态" class="mt-4">
          <div class="flex flex-wrap items-center gap-2">
            <ButtonPrimary text="默认" />
            <ButtonPrimary text="加载中" loading />
            <ButtonPrimary text="禁用" disabled />
          </div>
        </SpecimenCase>

        <SpecimenCase label="切换加载态（看宽度过渡）" class="mt-5">
          <div class="flex items-center gap-2">
            <ButtonPrimary
              text="保存"
              :loading="loadingDemo"
              class="min-w-24"
              @click="loadingDemo = true"
            />
            <ButtonSecondary text="切回来" :disabled="!loadingDemo" @click="loadingDemo = false" />
          </div>
        </SpecimenCase>

        <SpecimenCase label="danger" class="mt-5">
          <div class="flex flex-wrap items-center gap-2">
            <ButtonPrimary text="删除" danger />
            <ButtonPrimary text="删除中" danger loading />
            <ButtonPrimary text="不可删除" danger disabled />
          </div>
        </SpecimenCase>

        <SpecimenCase label="block" class="mt-5">
          <div>
            <ButtonPrimary text="全宽" block />
          </div>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="ButtonPrimary Props" :rows="PROPS.ButtonPrimary" />
    </ComponentDocsSection>

    <!-- ButtonSecondary -->
    <ComponentDocsSection title="ButtonSecondary" class="mt-16">
      <template #description>
        纯文字按钮，可带前置图标与尾部内容。背景层是独立缩放的
        <code class="font-mono">::before</code>，hover 时从 90% 弹到 100%。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="状态" class="mt-4">
          <div class="flex flex-wrap items-center gap-2">
            <ButtonSecondary text="默认" />
            <ButtonSecondary text="激活" is-active />
            <ButtonSecondary text="禁用" disabled />
            <ButtonSecondary text="新建文章">
              <FilePlus2 aria-hidden="true" class="size-4" />
            </ButtonSecondary>
          </div>
        </SpecimenCase>

        <SpecimenCase label="block + align" class="mt-5">
          <div class="space-y-1">
            <ButtonSecondary text="全宽居中" block />
            <ButtonSecondary text="全宽左对齐" block align="start">
              <Menu aria-hidden="true" class="size-4" />
            </ButtonSecondary>
            <ButtonSecondary text="带尾部内容" block align="start">
              <template #suffix>
                <Check aria-hidden="true" class="size-4" />
              </template>
            </ButtonSecondary>
          </div>
        </SpecimenCase>

        <SpecimenCase label="调用方控制布局" class="mt-5">
          <div class="flex items-center gap-2">
            <ButtonSecondary text="h-11" class="h-11" />
            <ButtonSecondary text="圆角跟随" class="rounded-full" />
          </div>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="ButtonSecondary Props" :rows="PROPS.ButtonSecondary" />
    </ComponentDocsSection>

    <!-- ButtonThird -->
    <ComponentDocsSection title="ButtonThird" class="mt-16">
      <template #description>
        最低层级的辅助动作，页脚链接、「忘记密码」这类。没有按钮面，只有文字色，hover
        时一条细线从左侧展开。字号不写死，跟随所在上下文继承。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="状态" class="mt-4">
          <div class="flex flex-wrap items-center gap-2">
            <ButtonThird text="稍后处理" />
            <ButtonThird text="恢复默认" />
            <ButtonThird text="当前选择" is-active />
            <ButtonThird text="移除标签" danger />
            <ButtonThird text="不可用" disabled />
          </div>
        </SpecimenCase>

        <SpecimenCase label="左右插槽" class="mt-5">
          <div class="flex flex-wrap items-center gap-2">
            <ButtonThird text="返回列表">
              <ArrowLeft aria-hidden="true" class="size-4" />
            </ButtonThird>
            <ButtonThird text="继续">
              <template #suffix>
                <ArrowRight aria-hidden="true" class="size-4" />
              </template>
            </ButtonThird>
            <ButtonThird text="更多设置">
              <Settings aria-hidden="true" class="size-4" />
              <template #suffix>
                <ChevronDown aria-hidden="true" class="size-4" />
              </template>
            </ButtonThird>
          </div>
        </SpecimenCase>

        <SpecimenCase label="外链" class="mt-5">
          <div class="flex flex-wrap items-center gap-2">
            <ButtonThird
              text="Tailwind 文档 ↗"
              href="https://tailwindcss.com"
              target="_blank"
              rel="noopener noreferrer"
            />
            <ButtonThird text="链接也能禁用" href="https://tailwindcss.com" disabled />
          </div>
        </SpecimenCase>

        <SpecimenCase label="字号跟随上下文" class="mt-5">
          <div class="flex flex-wrap items-baseline gap-2 text-xs">
            <ButtonThird text="12px" />
            <span class="text-base">
              <ButtonThird text="16px" />
            </span>
          </div>
        </SpecimenCase>

        <SpecimenCase label="三级并列" class="mt-5">
          <div class="flex flex-wrap items-center gap-2">
            <ButtonPrimary text="发布" />
            <ButtonSecondary text="保存草稿" />
            <ButtonThird text="稍后" />
          </div>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="ButtonThird Props" :rows="PROPS.ButtonThird" />
    </ComponentDocsSection>

    <!-- ButtonIcon -->
    <ComponentDocsSection title="ButtonIcon" class="mt-16">
      <template #description>
        紧凑型方形按钮，通常承载图标，也可用于分页数字等短内容。宽高 1:1，靠
        <code class="font-mono">aspect-square</code>
        保证；图标不是正方形也不影响。视觉语言与 ButtonSecondary 一致。
      </template>

      <SpecimenPair class="mt-6">
        <SpecimenCase label="状态" class="mt-4">
          <div class="flex items-center gap-2">
            <ButtonIcon label="添加">
              <Plus aria-hidden="true" class="size-4" />
            </ButtonIcon>
            <ButtonIcon label="已收藏" is-active>
              <Bookmark aria-hidden="true" class="size-4" />
            </ButtonIcon>
            <ButtonIcon label="删除不可用" disabled>
              <Trash2 aria-hidden="true" class="size-4" />
            </ButtonIcon>
          </div>
        </SpecimenCase>

        <SpecimenCase label="扁图标仍为 1:1" class="mt-5">
          <div class="flex items-center gap-2">
            <ButtonIcon label="菜单">
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
            </ButtonIcon>
          </div>
        </SpecimenCase>

        <SpecimenCase label="调用方指定尺寸与圆角" class="mt-5">
          <div class="flex items-center gap-2">
            <ButtonIcon label="全屏预览" class="size-10 rounded-full">
              <Maximize2 aria-hidden="true" class="size-4" />
            </ButtonIcon>
          </div>
        </SpecimenCase>
      </SpecimenPair>

      <ApiTable caption="ButtonIcon Props" :rows="PROPS.ButtonIcon" />
    </ComponentDocsSection>
  </div>
</template>
