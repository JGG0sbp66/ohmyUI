/** 从模态 DOM 或其已授权 portal 中解析所属模态 id。 */
export function resolveDialogOwnerId(element: HTMLElement | null): string | undefined {
  const owner = element?.closest<HTMLElement>(
    "[data-ohmyui-dialog-layer], [data-dialog-focus-allow]",
  );
  return owner?.dataset.ohmyuiDialogLayer ?? owner?.dataset.dialogFocusAllow;
}

/** 避免把 Vue useId 拼进 selector，逐项匹配也兼容跨 Document。 */
export function findDialogOwner(
  document: Document,
  ownerId: string | undefined,
): HTMLElement | null {
  if (!ownerId) return null;
  return (
    Array.from(document.querySelectorAll<HTMLElement>("[data-ohmyui-dialog-layer]")).find(
      (element) => element.dataset.ohmyuiDialogLayer === ownerId,
    ) ?? null
  );
}

export function getDialogOwnedPortals(document: Document, ownerId: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-dialog-focus-allow]")).filter(
    (element) => element.isConnected && element.dataset.dialogFocusAllow === ownerId,
  );
}

export function isDialogOwnerInteractive(document: Document, ownerId: string | undefined): boolean {
  if (!ownerId) return true;
  const owner = findDialogOwner(document, ownerId);
  return Boolean(owner && !owner.inert && owner.getAttribute("aria-hidden") !== "true");
}
