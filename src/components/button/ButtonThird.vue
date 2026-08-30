<!-- src/components/button/ButtonThird.vue -->
<script lang="ts" setup>
import { computed, type Component } from "vue";

const props = withDefaults(
  defineProps<{
    /** 纯图标场景请用 ButtonIcon，本组件必须有文字 */
    text: string;
    /** 可选切换态；传入时同步输出 aria-pressed */
    isActive?: boolean;
    disabled?: boolean;
    /** 低强调破坏性操作：移除、清除单项 */
    danger?: boolean;
    /** 外链地址；传入后默认渲染成 <a> */
    href?: string;
    target?: string;
    rel?: string;
    /**
     * 覆盖渲染的标签或组件，优先级高于 href。站内跳转传 RouterLink 即可，
     * to 这类额外属性经 fallthrough 直接落到它身上 —— 组件自身不依赖路由。
     */
    as?: string | Component;
    /** 仅在渲染原生 <button> 时生效 */
    type?: "button" | "submit" | "reset";
  }>(),
  { disabled: false, danger: false, type: "button" },
);

defineSlots<{
  /** 文字前的图标 */
  default?(): unknown;
  /** 文字后的尾随内容，例如外链箭头 */
  suffix?(): unknown;
}>();

const tag = computed<string | Component>(() => props.as ?? (props.href ? "a" : "button"));

const isNativeButton = computed(() => tag.value === "button");

/*
  <button> 用原生 disabled；链接没有这个属性，光靠 pointer-events-none 只挡住鼠标，
  回车照样跳走，所以禁用时摘掉 href 并退出 tab 序列。视觉禁用态两条路径共用。
*/
const tagProps = computed(() =>
  isNativeButton.value
    ? { type: props.type, disabled: props.disabled, "aria-pressed": props.isActive }
    : {
        href: props.disabled ? undefined : props.href,
        target: props.target,
        rel: props.rel,
        "aria-disabled": props.disabled || undefined,
        tabindex: props.disabled ? -1 : undefined,
      },
);

/*
  第三级动作不生成按钮面：只有文字色，加一条从左侧展开的底部细线。

  字号刻意不写：调用方所在的上下文决定，页脚 13px 和正文 16px 用的是同一个组件。
  尺寸同样由内容与内边距决定，需要精确高度时调用方补 h-*。
*/
const BASE = `
  group/third relative inline-flex items-center gap-1 bg-transparent px-1 py-0.5
  transition-colors
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg
`;

/*
  细线动的是 width，不是 scale-x。

  1px 高的条带经不起合成层来回搬：transform 动画期间浏览器会把它提成独立层、
  按整数设备像素栅格化，动画一结束层被回收、又按元素真实的小数 y 偏移重新绘制，
  两次栅格化结果不同 —— 落在半像素上时表现为线跑完的瞬间「突然变粗」。
  父级 items-center 配更高的兄弟节点（primary/secondary 并排）、或祖先链里有
  items-baseline，都会让偏移变成小数，所以只在部分位置能看见。

  这条线是 absolute、无子节点，改宽度只重排它自己，碰不到兄弟和父级，
  代价可以忽略；换来的是每帧同一种栅格化，没有跳变。
*/
const UNDERLINE = `
  pointer-events-none absolute bottom-0 left-1 h-px bg-current opacity-30
  transition-[width] duration-300 ease-out motion-reduce:transition-none
`;

/*
  细线取 bg-current，跟着根节点的文字色走，hover 时两者同步过渡，不用各写一份颜色。
  激活与禁用都是 prop：链接分支没有 :disabled / :enabled 伪类可用，统一在 JS 里分支。
*/
const toneClass = computed(() => {
  if (props.danger) return props.isActive ? "text-danger" : "text-danger/80 hover:text-danger";
  return props.isActive ? "text-fg" : "text-fg-muted hover:text-fg";
});
</script>

<template>
  <component
    :is="tag"
    v-bind="tagProps"
    :class="[
      BASE,
      toneClass,
      props.disabled ? 'pointer-events-none cursor-not-allowed opacity-50' : 'cursor-pointer',
    ]"
  >
    <slot></slot>
    <span>{{ props.text }}</span>
    <slot name="suffix"></slot>

    <!-- calc(100% - 0.5rem)：包含块是根节点的 padding box，扣掉 px-1 两侧后正好等于内容宽度 -->
    <span
      aria-hidden="true"
      :class="[
        UNDERLINE,
        props.isActive ? 'w-[calc(100%-0.5rem)]' : 'w-0 group-hover/third:w-[calc(100%-0.5rem)]',
      ]"
    ></span>
  </component>
</template>
