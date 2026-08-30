import type { Component, HTMLAttributes } from "vue";

export type SelectionValue = string | number;

export type AdaptivePresentation = "auto" | "popover" | "sheet";

export type SelectionDensity = "compact" | "touch";

/** Select 与 Combobox 共享的数据形状；交互和筛选语义仍由各组件负责。 */
export interface SelectionOption {
  value: SelectionValue;
  label: string;
  textValue?: string;
  description?: string;
  icon?: Component;
  iconClass?: HTMLAttributes["class"];
  disabled?: boolean;
}
