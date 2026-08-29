interface DialogEntry {
  id: symbol;
  locksScroll: boolean;
  layer: number;
  closing: boolean;
  wrapper: HTMLElement;
  focus: () => void;
  setInteractive: (interactive: boolean) => void;
  adoptReturnFocus: (target: HTMLElement | null, removedWrapper: HTMLElement) => void;
}

interface BodyStyleSnapshot {
  overflow: string;
  paddingRight: string;
}

interface ElementAccessibilitySnapshot {
  inert: boolean;
  ariaHidden: string | null;
}

interface DocumentDialogState {
  stack: DialogEntry[];
  nextLayer: number;
  scrollLockCount: number;
  bodyStyleSnapshot?: BodyStyleSnapshot;
  backgroundSnapshots: Map<HTMLElement, ElementAccessibilitySnapshot>;
  backgroundObserver?: MutationObserver;
  backgroundSyncQueued: boolean;
}

export interface DialogRegistration {
  id: symbol;
  locksScroll: boolean;
  wrapper: HTMLElement;
  focus: () => void;
  setInteractive: (interactive: boolean) => void;
  adoptReturnFocus: (target: HTMLElement | null, removedWrapper: HTMLElement) => void;
}

export interface DialogCloseTransition {
  wasTop: boolean;
  hasNextActive: boolean;
  nextWrapper?: HTMLElement;
  focusNext?: () => void;
}

export interface DialogRemovalResult {
  wasInteractive: boolean;
  hasNextInteractive: boolean;
  nextWrapper?: HTMLElement;
  focusNext?: () => void;
}

const BASE_DIALOG_LAYER = 70;
const documentStates = new WeakMap<Document, DocumentDialogState>();

function getDocumentState(document: Document): DocumentDialogState {
  const existing = documentStates.get(document);
  if (existing) return existing;

  const state: DocumentDialogState = {
    stack: [],
    nextLayer: BASE_DIALOG_LAYER,
    scrollLockCount: 0,
    backgroundSnapshots: new Map(),
    backgroundSyncQueued: false,
  };
  documentStates.set(document, state);
  return state;
}

function findLastEntry(
  entries: DialogEntry[],
  predicate: (entry: DialogEntry) => boolean,
): DialogEntry | undefined {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry && predicate(entry)) return entry;
  }
  return undefined;
}

function getTopActiveEntry(state: DocumentDialogState): DialogEntry | undefined {
  return findLastEntry(state.stack, (entry) => !entry.closing);
}

function getInteractiveEntry(state: DocumentDialogState): DialogEntry | undefined {
  return getTopActiveEntry(state) ?? state.stack.at(-1);
}

function acquireScrollLock(document: Document, state: DocumentDialogState): void {
  state.scrollLockCount += 1;
  if (state.scrollLockCount > 1) return;

  const body = document.body;
  const view = document.defaultView;
  if (!body || !view) return;

  state.bodyStyleSnapshot = {
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
  };

  const scrollbarWidth = Math.max(0, view.innerWidth - document.documentElement.clientWidth);
  const currentPadding = Number.parseFloat(view.getComputedStyle(body).paddingRight) || 0;

  body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
  }
}

function releaseScrollLock(document: Document, state: DocumentDialogState): void {
  state.scrollLockCount = Math.max(0, state.scrollLockCount - 1);
  if (state.scrollLockCount > 0) return;

  const body = document.body;
  const snapshot = state.bodyStyleSnapshot;
  if (body && snapshot) {
    body.style.overflow = snapshot.overflow;
    body.style.paddingRight = snapshot.paddingRight;
  }

  state.bodyStyleSnapshot = undefined;
}

function restoreBackground(state: DocumentDialogState): void {
  for (const [element, snapshot] of state.backgroundSnapshots) {
    element.inert = snapshot.inert;
    if (snapshot.ariaHidden === null) element.removeAttribute("aria-hidden");
    else element.setAttribute("aria-hidden", snapshot.ariaHidden);
  }
  state.backgroundSnapshots.clear();
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

function stopBackgroundObserver(state: DocumentDialogState): void {
  state.backgroundObserver?.disconnect();
  state.backgroundObserver = undefined;
  state.backgroundSyncQueued = false;
}

function syncBackgroundIsolation(document: Document, state: DocumentDialogState): void {
  restoreBackground(state);

  if (state.stack.length === 0 || !document.body) {
    stopBackgroundObserver(state);
    return;
  }

  if (!state.backgroundObserver) {
    const MutationObserverConstructor = document.defaultView?.MutationObserver;
    if (MutationObserverConstructor) {
      state.backgroundObserver = new MutationObserverConstructor(() => {
        if (state.backgroundSyncQueued) return;
        state.backgroundSyncQueued = true;
        queueMicrotask(() => {
          state.backgroundSyncQueued = false;
          syncBackgroundIsolation(document, state);
        });
      });
      state.backgroundObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-dialog-focus-allow"],
      });
    }
  }

  const wrappers = state.stack
    .map((entry) => entry.wrapper)
    .filter((wrapper) => wrapper.isConnected);
  const interactiveOwnerId = getInteractiveEntry(state)?.wrapper.dataset.ohmyuiDialogLayer;
  const allowedPortals = Array.from(
    document.querySelectorAll<HTMLElement>("[data-dialog-focus-allow]"),
  ).filter(
    (element) =>
      interactiveOwnerId !== undefined && element.dataset.dialogFocusAllow === interactiveOwnerId,
  );
  const protectedElements = [...wrappers, ...allowedPortals];
  const backgroundRoots: HTMLElement[] = [];
  collectBackgroundRoots(document.body, protectedElements, backgroundRoots);

  for (const element of backgroundRoots) {
    state.backgroundSnapshots.set(element, {
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    });
    element.inert = true;
    element.setAttribute("aria-hidden", "true");
  }
}

function syncInteractivity(document: Document, state: DocumentDialogState): void {
  const interactiveEntry = getInteractiveEntry(state);
  for (const entry of state.stack) {
    entry.setInteractive(entry === interactiveEntry);
  }
  syncBackgroundIsolation(document, state);
}

export function registerDialog(document: Document, registration: DialogRegistration): number {
  const state = getDocumentState(document);
  const existingIndex = state.stack.findIndex((entry) => entry.id === registration.id);
  const existing = existingIndex >= 0 ? state.stack.splice(existingIndex, 1)[0] : undefined;

  if (existing?.locksScroll !== registration.locksScroll) {
    if (registration.locksScroll) acquireScrollLock(document, state);
    else if (existing?.locksScroll) releaseScrollLock(document, state);
  } else if (!existing && registration.locksScroll) {
    acquireScrollLock(document, state);
  }

  const layer = state.nextLayer;
  state.nextLayer += 1;
  state.stack.push({
    ...registration,
    layer,
    closing: false,
  });
  syncInteractivity(document, state);
  return layer;
}

export function startDialogClose(document: Document, id: symbol): DialogCloseTransition {
  const state = getDocumentState(document);
  const entry = state.stack.find((candidate) => candidate.id === id);
  const wasTop = getTopActiveEntry(state)?.id === id;

  if (entry) entry.closing = true;
  const nextActive = getTopActiveEntry(state);
  syncInteractivity(document, state);

  return {
    wasTop,
    hasNextActive: nextActive !== undefined,
    nextWrapper: wasTop ? nextActive?.wrapper : undefined,
    focusNext: wasTop ? nextActive?.focus : undefined,
  };
}

export function unregisterDialog(
  document: Document,
  id: symbol,
  outerReturnTarget: HTMLElement | null,
): DialogRemovalResult {
  const state = getDocumentState(document);
  const wasInteractive = getInteractiveEntry(state)?.id === id;
  const index = state.stack.findIndex((entry) => entry.id === id);
  const [removedEntry] = index >= 0 ? state.stack.splice(index, 1) : [];

  if (removedEntry?.locksScroll) releaseScrollLock(document, state);
  if (removedEntry) {
    for (const entry of state.stack) {
      entry.adoptReturnFocus(outerReturnTarget, removedEntry.wrapper);
    }
  }

  const nextInteractive = getInteractiveEntry(state);
  syncInteractivity(document, state);
  if (state.stack.length === 0) state.nextLayer = BASE_DIALOG_LAYER;

  return {
    wasInteractive,
    hasNextInteractive: nextInteractive !== undefined,
    nextWrapper: wasInteractive ? nextInteractive?.wrapper : undefined,
    focusNext: wasInteractive ? nextInteractive?.focus : undefined,
  };
}

export function updateDialogScrollLock(document: Document, id: symbol, locksScroll: boolean): void {
  const state = getDocumentState(document);
  const entry = state.stack.find((candidate) => candidate.id === id);
  if (!entry || entry.locksScroll === locksScroll) return;

  if (locksScroll) acquireScrollLock(document, state);
  else releaseScrollLock(document, state);
  entry.locksScroll = locksScroll;
}

export function isTopDialog(document: Document, id: symbol): boolean {
  return getInteractiveEntry(getDocumentState(document))?.id === id;
}
