<!-- src/components/button/ButtonPrimary.vue -->
<script lang="ts" setup>
import Loading from "../feedback/Loading.vue";

const props = withDefaults(
  defineProps<{
    text: string;
    /** 加载中：显示指示器并禁用点击 */
    loading?: boolean;
    disabled?: boolean;
    /** 破坏性操作：删除、清空这类不可逆动作 */
    danger?: boolean;
    /** 撑满父容器宽度 */
    block?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    loading: false,
    disabled: false,
    danger: false,
    block: false,
    type: "button",
  },
);

/*
  只输出内在样式，不输出宽高 —— 调用方传 min-w-24 / flex-1 / max-w-* 都能直接生效。
  ::before 承载 hover 色并只过渡 opacity：全局 hue 改变时，两层背景会在同一帧
  重算；正常 hover 仍保留平滑反馈，不再 transition 主题派生的 background-color。
  禁用与加载都走 :disabled 伪类，不在 JS 里分支。
*/
const BASE = `
  relative isolate cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap
  rounded-lg px-4 py-2 text-sm leading-tight font-bold text-white
  transition-[opacity,scale,filter]
  before:pointer-events-none before:absolute before:inset-0 before:z-0
  before:content-[''] before:opacity-0 before:transition-opacity
  enabled:hover:before:opacity-100 enabled:active:scale-90
  disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale-[0.3]
`;
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :class="[
      BASE,
      props.block ? 'flex w-full' : 'inline-flex',
      props.danger ? 'bg-danger before:bg-danger-hover' : 'bg-accent before:bg-accent-hover',
    ]"
  >
    <!-- 间距放在动画容器内部，而不是父级 gap —— 否则指示器收起后会残留一段空隙 -->
    <Transition name="fade-width">
      <span v-if="props.loading" class="relative z-10 flex shrink-0 items-center overflow-hidden">
        <span class="mr-2 flex items-center">
          <Loading />
        </span>
      </span>
    </Transition>

    <span class="relative z-10 truncate">{{ props.text }}</span>
  </button>
</template>

<style scoped>
/* 加载指示器进出：宽度与透明度同步过渡。100px 只需大于指示器 + 间距的实际宽度 */
.fade-width-enter-active,
.fade-width-leave-active {
  transition:
    max-width 0.3s ease,
    opacity 0.3s ease;
}

.fade-width-enter-from,
.fade-width-leave-to {
  max-width: 0;
  opacity: 0;
}

.fade-width-enter-to,
.fade-width-leave-from {
  max-width: 100px;
  opacity: 1;
}
</style>
