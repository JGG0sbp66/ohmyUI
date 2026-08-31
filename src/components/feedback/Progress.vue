<!-- src/components/feedback/Progress.vue -->
<script setup lang="ts">
import { computed, useId } from "vue";

type ProgressSize = "sm" | "md" | "lg";

interface ProgressContext {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly percentage: number;
  readonly indeterminate: boolean;
}

interface Props {
  /** 可见标签的 fallback；内部进度条通过 aria-labelledby 引用可见标签 */
  label: string;
  /** 当前值；非有限值回退为归一化后的 min */
  value?: number;
  /** 最小值；非有限值回退为 0 */
  min?: number;
  /** 最大值；非法时优先回退为 min + 100，必要时整个范围回退为 0..100 */
  max?: number;
  /** 是否显示右侧值；不影响进度条的 ARIA 语义 */
  showValue?: boolean;
  /** 轨道高度 */
  size?: ProgressSize;
  /** 是否显示不确定进度 */
  indeterminate?: boolean;
  /** 不确定状态的默认可见文案与 aria-valuetext */
  indeterminateText?: string;
  /** 显式 aria-valuetext；优先于值插槽及自动文本规则 */
  ariaValueText?: string;
  /** 是否启用确定态宽度过渡和不确定态移动动画 */
  animated?: boolean;
  /** 格式化确定态的默认可见值与 aria-valuetext */
  formatValue?: (context: ProgressContext) => string;
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  min: 0,
  max: 100,
  showValue: true,
  size: "md",
  indeterminate: false,
  indeterminateText: undefined,
  ariaValueText: undefined,
  animated: true,
  formatValue: undefined,
});

const slots = defineSlots<{
  label?: (context: ProgressContext) => unknown;
  value?: (context: ProgressContext) => unknown;
}>();

const labelId = useId();

const SIZE_CLASS: Record<ProgressSize, string> = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const progressContext = computed<ProgressContext>(() => {
  let min = Number.isFinite(props.min) ? props.min : 0;
  let max = Number.isFinite(props.max) && props.max > min ? props.max : min + 100;

  if (!Number.isFinite(max) || max <= min) {
    min = 0;
    max = 100;
  }

  const rawValue = Number.isFinite(props.value) ? props.value : min;
  const value = Math.min(max, Math.max(min, rawValue));
  const span = max - min;
  let rawPercentage: number;

  if (Number.isFinite(span)) {
    rawPercentage = ((value - min) / span) * 100;
  } else {
    const scale = Math.max(Math.abs(min), Math.abs(max), Math.abs(value));
    const scaledMin = min / scale;
    const scaledMax = max / scale;
    const scaledValue = value / scale;

    rawPercentage = ((scaledValue - scaledMin) / (scaledMax - scaledMin)) * 100;
  }

  const percentage = Number.isFinite(rawPercentage)
    ? Math.min(100, Math.max(0, rawPercentage))
    : 0;

  return {
    value,
    min,
    max,
    percentage,
    indeterminate: props.indeterminate,
  };
});

const valueText = computed(() => {
  if (progressContext.value.indeterminate) return props.indeterminateText;

  return (
    props.formatValue?.(progressContext.value) ??
    `${Math.round(progressContext.value.percentage)}%`
  );
});

const shouldShowVisibleValue = () =>
  props.showValue &&
  (!progressContext.value.indeterminate ||
    Boolean(props.indeterminateText) ||
    Boolean(slots.value));

const getAriaValueText = () => {
  if (props.ariaValueText !== undefined) return props.ariaValueText;
  if (slots.value) return undefined;
  return valueText.value;
};

const fillWidth = computed(() => `${progressContext.value.percentage}%`);
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="mb-1 flex items-end justify-between px-1 text-sm text-fg-subtle">
      <span :id="labelId">
        <slot name="label" v-bind="progressContext">{{ props.label }}</slot>
      </span>
      <span v-if="shouldShowVisibleValue()">
        <slot name="value" v-bind="progressContext">{{ valueText }}</slot>
      </span>
    </div>

    <div
      role="progressbar"
      :aria-labelledby="labelId"
      :aria-valuemin="progressContext.min"
      :aria-valuemax="progressContext.max"
      :aria-valuenow="progressContext.indeterminate ? undefined : progressContext.value"
      :aria-valuetext="getAriaValueText()"
      :class="[
        'w-full overflow-hidden rounded-full bg-bg-muted',
        SIZE_CLASS[props.size],
      ]"
    >
      <div
        :class="[
          'h-full bg-accent',
          progressContext.indeterminate
            ? 'progress-fill--indeterminate'
            : props.animated
              ? 'progress-fill--animated'
              : undefined,
          progressContext.indeterminate && props.animated
            ? 'progress-fill--indeterminate-animated'
            : undefined,
        ]"
        :style="progressContext.indeterminate ? undefined : { width: fillWidth }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.progress-fill--animated {
  transition: width 250ms ease-out;
}

.progress-fill--indeterminate {
  --progress-indeterminate-static-background: repeating-linear-gradient(
    135deg,
    var(--theme-accent) 0,
    var(--theme-accent) 0.5rem,
    var(--theme-bg-muted) 0.5rem,
    var(--theme-bg-muted) 1rem
  );

  width: 100%;
  background-color: transparent;
  background-image: var(--progress-indeterminate-static-background);
}

.progress-fill--indeterminate-animated {
  width: 40%;
  background-color: var(--theme-accent);
  background-image: none;
  animation: progress-indeterminate 1.4s ease-in-out infinite;
}

@keyframes progress-indeterminate {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(250%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill--animated {
    transition: none;
  }

  .progress-fill--indeterminate-animated {
    width: 100%;
    background-color: transparent;
    background-image: var(--progress-indeterminate-static-background);
    animation: none;
    transform: none;
  }
}
</style>
