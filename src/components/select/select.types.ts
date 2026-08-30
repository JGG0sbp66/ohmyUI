import type { Component, HTMLAttributes } from "vue";

import type { AnchoredPlacement } from "../overlay/internal/anchored-position.types";

export type SelectValue = string | number;

export type SelectPresentation = "auto" | "popover" | "sheet";

export type SelectFocusIntent = "selected" | "first" | "last";

export interface SelectOption {
  value: SelectValue;
  label: string;
  /** typeahead 使用的文本；未传时使用 label。 */
  textValue?: string;
  description?: string;
  icon?: Component;
  iconClass?: HTMLAttributes["class"];
  disabled?: boolean;
}

export interface SelectGroup {
  key: string;
  label?: string;
  options: readonly SelectOption[];
}

export interface SelectCommonProps {
  label: string;
  placeholder?: string;
  clearable?: boolean;
  clearLabel?: string;
  emptyLabel?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  block?: boolean;
  presentation?: SelectPresentation;
  placement?: AnchoredPlacement;
  offset?: number;
  collisionPadding?: number;
  sheetTitle?: string;
  sheetDescription?: string;
  closeLabel?: string;
  teleportTo?: string | HTMLElement;
  class?: HTMLAttributes["class"];
  style?: HTMLAttributes["style"];
  panelClass?: HTMLAttributes["class"];
}

export interface SelectProps extends SelectCommonProps {
  options: readonly SelectOption[];
}

export interface GroupedSelectProps extends SelectCommonProps {
  groups: readonly SelectGroup[];
}

export interface SelectRootProps extends SelectCommonProps {
  groups: readonly SelectGroup[];
}

export interface SelectListboxExpose {
  focusInitial: (intent?: SelectFocusIntent) => void;
}
