import type { Component, HTMLAttributes } from "vue";

export type FilterTabValue = string | number | null;

export type FilterTabCountVisibility = "active" | "always" | "never";

export interface FilterTabOption {
  /** 在同一个 FilterTabs 中必须唯一的受控值 */
  value: FilterTabValue;
  label: string;
  count?: number;
  disabled?: boolean;
  /** 默认作为装饰图标渲染；可通过 icon slot 完全替换 */
  icon?: Component;
  iconClass?: HTMLAttributes["class"];
}
