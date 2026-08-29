import type { HTMLAttributes } from "vue";

export type BottomSheetRole = "dialog" | "alertdialog";

export type BottomSheetDismissReason = "backdrop" | "escape" | "close" | "drag";

export interface BottomSheetProps {
  modelValue: boolean;
  title?: string;
  description?: string;
  closeLabel?: string;
  role?: BottomSheetRole;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  lockScroll?: boolean;
  returnFocus?: boolean;
  /** 面板内的 CSS selector；未匹配时默认聚焦关闭按钮或面板。 */
  initialFocus?: string;
  teleportTo?: string | HTMLElement;
  draggable?: boolean;
  panelClass?: HTMLAttributes["class"];
  panelStyle?: HTMLAttributes["style"];
}

export interface BottomSheetEmits {
  "update:modelValue": [value: boolean];
  dismiss: [reason: BottomSheetDismissReason];
  "expanded-change": [expanded: boolean];
  "after-open": [];
  "after-close": [];
}

export interface BottomSheetSlotProps {
  close: () => void;
  expanded: boolean;
}

export interface BottomSheetHeaderSlotProps extends BottomSheetSlotProps {
  titleId?: string;
  descriptionId?: string;
}
