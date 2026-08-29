import type { Component, HTMLAttributes } from "vue";

import type { TagTone } from "../../tag/tag.types";
import type { DialogCommonProps, DialogEmits } from "./internal/dialog.types";

export interface ConfirmDialogProps extends DialogCommonProps {
  icon?: Component;
  title: string;
  question: string;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  /** 使用危险色确认按钮，并在未指定 iconClass 时同步图标颜色。 */
  danger?: boolean;
  iconClass?: HTMLAttributes["class"];
  confirmClass?: HTMLAttributes["class"];
  loading?: boolean;
  confirmDisabled?: boolean;
}

export interface ConfirmDialogEmits extends DialogEmits {
  confirm: [];
  cancel: [];
}

export interface ConfirmListItem {
  key: string | number;
  label: string;
  tag?: string;
  tagTone?: TagTone;
  tagClass?: HTMLAttributes["class"];
}

export interface ConfirmListDialogProps extends ConfirmDialogProps {
  items: readonly ConfirmListItem[];
}
