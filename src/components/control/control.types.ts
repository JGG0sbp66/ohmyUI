import type { Component, HTMLAttributes } from "vue";

export type SegmentedControlValue = string | number | null;

export interface SegmentedControlOption<T extends SegmentedControlValue> {
  /** 选项唯一值 */
  value: T;
  /** 选项可见文字 */
  label: string;
  /** 文字左侧的装饰图标 */
  icon?: Component;
  /** 覆盖图标默认尺寸 h-3.5 w-auto */
  iconClass?: HTMLAttributes["class"];
  disabled?: boolean;
}
