export function isHtmlElement(value: unknown, ownerDocument?: Document): value is HTMLElement {
  if (!value || typeof value !== "object") return false;
  const element = value as Element;
  if (
    element.nodeType !== 1 ||
    element.namespaceURI !== "http://www.w3.org/1999/xhtml" ||
    !element.ownerDocument
  ) {
    return false;
  }

  const HTMLElementConstructor = (ownerDocument ?? element.ownerDocument).defaultView?.HTMLElement;
  return HTMLElementConstructor ? value instanceof HTMLElementConstructor : true;
}

export function isNodeInDocument(value: unknown, document: Document): value is Node {
  const NodeConstructor = document.defaultView?.Node;
  if (NodeConstructor) return value instanceof NodeConstructor;
  return Boolean(value && typeof value === "object" && "nodeType" in value);
}

export function isElementInDocument(value: unknown, document: Document): value is Element {
  const ElementConstructor = document.defaultView?.Element;
  if (ElementConstructor) return value instanceof ElementConstructor;
  return isNodeInDocument(value, document) && value.nodeType === 1;
}

export function isElementAvailable(element: HTMLElement): boolean {
  if (!element.isConnected || element.matches(":disabled")) return false;
  if (element.closest("[hidden], [inert], [aria-hidden='true']")) return false;

  const view = element.ownerDocument.defaultView;
  if (view) {
    const style = view.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return false;
  }

  return element.getClientRects().length > 0;
}

/** 聚焦并验证浏览器确实接受了这次焦点移动。 */
export function tryFocusElement(element: HTMLElement | null): boolean {
  if (!element || !isElementAvailable(element)) return false;

  try {
    element.focus({ preventScroll: true });
  } catch {
    return false;
  }
  return element.ownerDocument.activeElement === element;
}
