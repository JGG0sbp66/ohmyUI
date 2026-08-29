import type { ConfirmDialogProps } from "../confirm.types";

/** ConfirmDialog 与其语义包装组件共享的公开默认值。 */
export const CONFIRM_DIALOG_DEFAULTS = {
  icon: undefined,
  warning: undefined,
  confirmText: "确认",
  cancelText: "取消",
  danger: false,
  iconClass: undefined,
  confirmClass: undefined,
  panelClass: undefined,
  loading: false,
  confirmDisabled: false,
  closeOnBackdrop: true,
  closeOnEscape: true,
  lockScroll: true,
  returnFocus: true,
  teleportTo: "body",
} as const satisfies Partial<ConfirmDialogProps>;
