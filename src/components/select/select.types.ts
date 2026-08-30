import type { HTMLAttributes } from "vue";

import type {
  AdaptivePresentation,
  SelectionOption,
  SelectionValue,
} from "../internal/selection/selection.types";
import type { AnchoredPlacement } from "../overlay/internal/anchored-position.types";

export type SelectValue = SelectionValue;

export type SelectPresentation = AdaptivePresentation;

export type SelectOption = SelectionOption;

export type SelectFocusIntent = "selected" | "first" | "last";

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
