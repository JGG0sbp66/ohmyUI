export type DialogSize = "sm" | "md" | "lg" | "xl" | "2xl";

export type DialogRole = "dialog" | "alertdialog";

export type DialogDismissReason = "backdrop" | "escape" | "close";

export interface DialogSlotProps {
  close: () => void;
}
