interface ElementAccessibilitySnapshot {
  inert: boolean;
  ariaHidden: string | null;
}

export interface BackgroundIsolationController {
  sync: (wrappers: readonly HTMLElement[], interactiveOwnerId?: string) => void;
  dispose: () => void;
}

function restoreElement(element: HTMLElement, snapshot: ElementAccessibilitySnapshot): void {
  element.inert = snapshot.inert;
  if (snapshot.ariaHidden === null) element.removeAttribute("aria-hidden");
  else element.setAttribute("aria-hidden", snapshot.ariaHidden);
}

function isHtmlElementForDocument(element: Element, document: Document): element is HTMLElement {
  const HTMLElementConstructor = document.defaultView?.HTMLElement;
  if (HTMLElementConstructor) return element instanceof HTMLElementConstructor;
  return element.namespaceURI === "http://www.w3.org/1999/xhtml";
}

function collectBackgroundRoots(
  root: HTMLElement,
  protectedElements: readonly HTMLElement[],
  output: HTMLElement[],
): void {
  const document = root.ownerDocument;
  for (const child of root.children) {
    if (!isHtmlElementForDocument(child, document)) continue;
    if (["SCRIPT", "STYLE", "LINK"].includes(child.tagName)) continue;
    if (protectedElements.includes(child)) continue;

    const containsProtectedElement = protectedElements.some((element) => child.contains(element));
    if (containsProtectedElement) collectBackgroundRoots(child, protectedElements, output);
    else output.push(child);
  }
}

export function createBackgroundIsolation(document: Document): BackgroundIsolationController {
  // root 在持续隔离期间只保存一次原值；后续同步只处理集合差异，避免反复恢复和重新快照。
  const snapshots = new Map<HTMLElement, ElementAccessibilitySnapshot>();
  let observer: MutationObserver | undefined;
  let syncQueued = false;
  let latestWrappers: readonly HTMLElement[] = [];
  let latestInteractiveOwnerId: string | undefined;

  function restoreAll(): void {
    for (const [element, snapshot] of snapshots) restoreElement(element, snapshot);
    snapshots.clear();
  }

  function stopObserver(): void {
    observer?.disconnect();
    observer = undefined;
    syncQueued = false;
  }

  function ensureObserver(): void {
    if (observer || !document.body) return;

    const MutationObserverConstructor = document.defaultView?.MutationObserver;
    if (!MutationObserverConstructor) return;

    observer = new MutationObserverConstructor(() => {
      if (syncQueued) return;
      syncQueued = true;
      queueMicrotask(() => {
        syncQueued = false;
        apply();
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-dialog-focus-allow"],
    });
  }

  function apply(): void {
    const body = document.body;
    const wrappers = latestWrappers.filter((wrapper) => wrapper.isConnected);
    if (!body || wrappers.length === 0) {
      restoreAll();
      stopObserver();
      return;
    }

    ensureObserver();

    const allowedPortals = Array.from(
      document.querySelectorAll<HTMLElement>("[data-dialog-focus-allow]"),
    ).filter(
      (element) =>
        latestInteractiveOwnerId !== undefined &&
        element.dataset.dialogFocusAllow === latestInteractiveOwnerId,
    );
    const protectedElements = [...wrappers, ...allowedPortals];
    const backgroundRoots: HTMLElement[] = [];
    collectBackgroundRoots(body, protectedElements, backgroundRoots);
    const nextRoots = new Set(backgroundRoots);

    for (const [element, snapshot] of snapshots) {
      if (nextRoots.has(element)) continue;
      restoreElement(element, snapshot);
      snapshots.delete(element);
    }

    for (const element of backgroundRoots) {
      if (!snapshots.has(element)) {
        snapshots.set(element, {
          inert: element.inert,
          ariaHidden: element.getAttribute("aria-hidden"),
        });
      }
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }
  }

  function sync(wrappers: readonly HTMLElement[], interactiveOwnerId?: string): void {
    latestWrappers = [...wrappers];
    latestInteractiveOwnerId = interactiveOwnerId;
    apply();
  }

  function dispose(): void {
    latestWrappers = [];
    latestInteractiveOwnerId = undefined;
    restoreAll();
    stopObserver();
  }

  return { dispose, sync };
}
