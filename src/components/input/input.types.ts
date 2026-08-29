import type { HTMLAttributes } from "vue";

export type InputType = "text" | "email" | "password" | "search" | "tel" | "url";

export type NumberStep = number | "any";

export type TextareaResize = "none" | "vertical";

/** 输入组件完整外壳接收的 class 与 style。 */
export interface InputRootProps {
  class?: HTMLAttributes["class"];
  style?: HTMLAttributes["style"];
}

/** 文本、数值和组合输入共同支持的原生状态。 */
export interface InputStateProps {
  disabled?: boolean;
  readonly?: boolean;
  /** 仅在 readonly 时，点击会尝试选择并复制当前展示值。 */
  copyOnClick?: boolean;
  required?: boolean;
  /** 只控制错误视觉与 aria-invalid；错误文案由字段层渲染。 */
  invalid?: boolean;
}

export interface InputTextProps extends InputRootProps, InputStateProps {
  /** 文本型原生 input 类型；数值输入由独立组件处理。 */
  type?: InputType;
  /** 需要直接调整原生 input 时使用。 */
  inputClass?: HTMLAttributes["class"];
}

export interface InputNumberProps extends InputRootProps, InputStateProps {
  min?: number;
  max?: number;
  step?: NumberStep;
  /** 需要直接调整原生 input 时使用。 */
  inputClass?: HTMLAttributes["class"];
}

export interface InputTextareaProps extends InputRootProps, InputStateProps {
  rows?: number;
  /** 默认不可拖拽；需要时可允许垂直调整。 */
  resize?: TextareaResize;
  /** 需要直接调整原生 textarea 时使用。 */
  textareaClass?: HTMLAttributes["class"];
}

/** class/style 继续通过 attrs 落到 InputText，不能在此声明后吞掉。 */
export interface InputPasswordProps extends InputStateProps {
  /** 需要直接调整原生 input 时使用。 */
  inputClass?: HTMLAttributes["class"];
  /** 密文状态下显隐按钮的无障碍名称。 */
  showPasswordLabel?: string;
  /** 明文状态下显隐按钮的无障碍名称。 */
  hidePasswordLabel?: string;
}

export interface InputSearchProps extends InputRootProps, InputStateProps {
  /** 搜索框宽度 class；默认使用紧凑宽度。 */
  width?: HTMLAttributes["class"];
  /** 需要直接调整原生 input 时使用。 */
  inputClass?: HTMLAttributes["class"];
  /** 清空按钮的 title 与无障碍名称。 */
  clearLabel?: string;
}

export interface ReadonlyCopyEmits {
  "copy-success": [value: string];
  "copy-error": [error: unknown];
}

export interface InputSearchEmits extends ReadonlyCopyEmits {
  search: [value: string];
}
