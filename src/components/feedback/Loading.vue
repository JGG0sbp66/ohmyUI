<!-- src/components/feedback/Loading.vue -->
<!--
  加载指示器。没有 props：尺寸取 1em、颜色取 currentColor，
  跟着所在处的排版上下文走，调用方靠 text-* 控制，不会有 class 冲突。
-->
<template>
  <!--
    animate-spin 整体匀速转（1s/圈），叠加前景圆环 1.5s 的弧长伸缩形成「呼吸」感。
    想调转速只能用 [animation-duration:*]：duration-* 是 transition 的时长工具类，对 animation 无效。
  -->
  <svg
    class="size-[1em] animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    ></circle>
    <circle
      class="spinner-path opacity-75"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
    ></circle>
  </svg>
</template>

<style scoped>
/* 弧长伸缩 + 蠕动。48 是圆周长（约 63）的 75%，超过就会绕回来重叠 */
@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 48, 150;
    stroke-dashoffset: -15;
  }

  100% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: -62;
  }
}

.spinner-path {
  animation: dash 1.5s ease-in-out infinite;
}

</style>
