import type {
  AnchoredAlign,
  AnchoredPlacement,
  AnchoredPositionInput,
  AnchoredPositionSnapshot,
  AnchoredSide,
} from "./anchored-position.types";

const OPPOSITE_SIDE: Record<AnchoredSide, AnchoredSide> = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), Math.max(minimum, maximum));

function parsePlacement(placement: AnchoredPlacement): {
  side: AnchoredSide;
  align: AnchoredAlign;
} {
  const [side, align = "center"] = placement.split("-") as [AnchoredSide, AnchoredAlign?];
  return { side, align };
}

function joinPlacement(side: AnchoredSide, align: AnchoredAlign): AnchoredPlacement {
  return align === "center" ? side : `${side}-${align}`;
}

function coordinates(
  input: AnchoredPositionInput,
  side: AnchoredSide,
  align: AnchoredAlign,
): { x: number; y: number } {
  const { referenceRect: reference, floatingWidth, floatingHeight, offset } = input;

  if (side === "top" || side === "bottom") {
    const x =
      align === "start"
        ? reference.left
        : align === "end"
          ? reference.right - floatingWidth
          : reference.left + (reference.width - floatingWidth) / 2;
    const y = side === "top" ? reference.top - floatingHeight - offset : reference.bottom + offset;
    return { x, y };
  }

  const x = side === "left" ? reference.left - floatingWidth - offset : reference.right + offset;
  const y =
    align === "start"
      ? reference.top
      : align === "end"
        ? reference.bottom - floatingHeight
        : reference.top + (reference.height - floatingHeight) / 2;
  return { x, y };
}

function overflowScore(input: AnchoredPositionInput, point: { x: number; y: number }): number {
  const { viewport, collisionPadding, floatingWidth, floatingHeight } = input;
  const left = viewport.x + collisionPadding;
  const top = viewport.y + collisionPadding;
  const right = viewport.x + viewport.width - collisionPadding;
  const bottom = viewport.y + viewport.height - collisionPadding;

  return (
    Math.max(0, left - point.x) +
    Math.max(0, point.x + floatingWidth - right) +
    Math.max(0, top - point.y) +
    Math.max(0, point.y + floatingHeight - bottom)
  );
}

/** 纯几何函数：不读取 DOM，也不依赖 Vue，可独立替换定位实现。 */
export function computeAnchoredPosition(input: AnchoredPositionInput): AnchoredPositionSnapshot {
  const preferred = parsePlacement(input.placement);
  let side = preferred.side;
  const align = preferred.align;
  let point = coordinates(input, side, align);

  if (input.flip) {
    const opposite = OPPOSITE_SIDE[side];
    const oppositePoint = coordinates(input, opposite, align);
    if (overflowScore(input, oppositePoint) < overflowScore(input, point)) {
      side = opposite;
      point = oppositePoint;
    }
  }

  if (input.shift) {
    const minimumX = input.viewport.x + input.collisionPadding;
    const minimumY = input.viewport.y + input.collisionPadding;
    const maximumX =
      input.viewport.x + input.viewport.width - input.collisionPadding - input.floatingWidth;
    const maximumY =
      input.viewport.y + input.viewport.height - input.collisionPadding - input.floatingHeight;
    point = {
      x: clamp(point.x, minimumX, maximumX),
      y: clamp(point.y, minimumY, maximumY),
    };
  }

  const viewportLeft = input.viewport.x + input.collisionPadding;
  const viewportTop = input.viewport.y + input.collisionPadding;
  const viewportRight = input.viewport.x + input.viewport.width - input.collisionPadding;
  const viewportBottom = input.viewport.y + input.viewport.height - input.collisionPadding;
  const availableWidth =
    side === "left"
      ? input.referenceRect.left - input.offset - viewportLeft
      : side === "right"
        ? viewportRight - input.referenceRect.right - input.offset
        : viewportRight - viewportLeft;
  const availableHeight =
    side === "top"
      ? input.referenceRect.top - input.offset - viewportTop
      : side === "bottom"
        ? viewportBottom - input.referenceRect.bottom - input.offset
        : viewportBottom - viewportTop;

  return {
    x: point.x,
    y: point.y,
    placement: joinPlacement(side, align),
    side,
    align,
    availableWidth: Math.max(0, availableWidth),
    availableHeight: Math.max(0, availableHeight),
  };
}
