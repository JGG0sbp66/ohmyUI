import type { CSSProperties, Ref } from "vue";

export type AnchoredSide = "top" | "right" | "bottom" | "left";
export type AnchoredAlign = "start" | "center" | "end";
export type AnchoredPlacement = AnchoredSide | `${AnchoredSide}-${AnchoredAlign}`;

export interface AnchoredViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnchoredPositionInput {
  referenceRect: DOMRectReadOnly;
  floatingWidth: number;
  floatingHeight: number;
  viewport: AnchoredViewport;
  placement: AnchoredPlacement;
  offset: number;
  collisionPadding: number;
  flip: boolean;
  shift: boolean;
}

export interface AnchoredPositionSnapshot {
  x: number;
  y: number;
  placement: AnchoredPlacement;
  side: AnchoredSide;
  align: AnchoredAlign;
  availableWidth: number;
  availableHeight: number;
}

export interface UseAnchoredPositionOptions {
  reference: Readonly<Ref<HTMLElement | null>>;
  floating: Readonly<Ref<HTMLElement | null>>;
  placement: () => AnchoredPlacement;
  offset: () => number;
  collisionPadding: () => number;
  flip: () => boolean;
  shift: () => boolean;
}

export type AnchoredFloatingStyle = CSSProperties & {
  "--ohmyui-available-width"?: string;
  "--ohmyui-available-height"?: string;
};
