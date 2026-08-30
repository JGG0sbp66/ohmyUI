import type { HTMLAttributes } from "vue";

import type {
  AdaptivePresentation,
  SelectionOption,
  SelectionValue,
} from "../internal/selection/selection.types";
import type { AnchoredPlacement } from "../overlay/internal/anchored-position.types";

export type ComboboxValue = SelectionValue;

export type ComboboxPresentation = AdaptivePresentation;

/** option.value 在同一个 options 集合内必须唯一。 */
export type ComboboxOption = SelectionOption;

export interface ComboboxProps {
  options: readonly ComboboxOption[];
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  block?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  error?: string;
  emptyLabel?: string;
  presentation?: ComboboxPresentation;
  placement?: AnchoredPlacement;
  offset?: number;
  collisionPadding?: number;
  panelClass?: HTMLAttributes["class"];
  sheetTitle?: string;
  sheetDescription?: string;
  closeLabel?: string;
  teleportTo?: string | HTMLElement;
  class?: HTMLAttributes["class"];
  style?: HTMLAttributes["style"];
  inputClass?: HTMLAttributes["class"];
}

export interface ComboboxOptionSlotProps {
  option: ComboboxOption;
  active: boolean;
  selected: boolean;
}

export interface ComboboxFeedbackSlotProps {
  label: string;
}
