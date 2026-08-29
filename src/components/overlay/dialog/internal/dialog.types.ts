import type { HTMLAttributes } from "vue";

export type DialogSize = "sm" | "md" | "lg" | "xl" | "2xl";

export type DialogRole = "dialog" | "alertdialog";

export type DialogDismissReason = "backdrop" | "escape" | "close";

export interface DialogProps {
  modelValue: boolean;
  size?: DialogSize;
  /** Tailwind 最大宽度类；传入后优先于 size。 */
  maxWidth?: string;
  role?: DialogRole;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  lockScroll?: boolean;
  returnFocus?: boolean;
  /** 面板内的 CSS selector；未匹配或无法聚焦时按默认顺序回退。 */
  initialFocus?: string;
  teleportTo?: string | HTMLElement;
  panelClass?: HTMLAttributes["class"];
  panelStyle?: HTMLAttributes["style"];
}

export interface DialogEmits {
  "update:modelValue": [value: boolean];
  dismiss: [reason: DialogDismissReason];
  "after-open": [];
  "after-close": [];
}

export interface DialogSlotProps {
  close: () => void;
}
