import type { HTMLAttributes } from "vue";

export type DialogSize = "sm" | "md" | "lg" | "xl" | "2xl";

export type DialogRole = "dialog" | "alertdialog";

export type DialogDismissReason = "backdrop" | "escape" | "close";

/** Dialog 及语义包装组件共同支持的生命周期与挂载策略。 */
export interface DialogCommonProps {
  modelValue: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  lockScroll?: boolean;
  returnFocus?: boolean;
  teleportTo?: string | HTMLElement;
  panelClass?: HTMLAttributes["class"];
}

export interface DialogProps extends DialogCommonProps {
  size?: DialogSize;
  /** Tailwind 最大宽度类；传入后优先于 size。 */
  maxWidth?: string;
  role?: DialogRole;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  /** 面板内的 CSS selector；未匹配或无法聚焦时按默认顺序回退。 */
  initialFocus?: string;
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
