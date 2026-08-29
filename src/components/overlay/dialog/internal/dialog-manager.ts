import { promoteDismissableLayer } from "../../internal/dismissable-layer";
import {
  createBackgroundIsolation,
  type BackgroundIsolationController,
} from "./background-isolation";
import { createScrollLock, type ScrollLockController } from "./scroll-lock";

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

interface DocumentDialogState {
  stack: DialogEntry[];
  nextLayer: number;
  scrollLock: ScrollLockController;
  backgroundIsolation: BackgroundIsolationController;
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
    scrollLock: createScrollLock(document),
    backgroundIsolation: createBackgroundIsolation(document),
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

function syncInteractivity(state: DocumentDialogState): void {
  const interactiveEntry = getInteractiveEntry(state);
  for (const entry of state.stack) {
    entry.setInteractive(entry === interactiveEntry);
  }

  state.backgroundIsolation.sync(
    state.stack.map((entry) => entry.wrapper),
    interactiveEntry?.wrapper.dataset.ohmyuiDialogLayer,
  );
}

export function registerDialog(document: Document, registration: DialogRegistration): number {
  const state = getDocumentState(document);
  const existingIndex = state.stack.findIndex((entry) => entry.id === registration.id);
  const existing = existingIndex >= 0 ? state.stack.splice(existingIndex, 1)[0] : undefined;

  if (existing?.locksScroll !== registration.locksScroll) {
    if (registration.locksScroll) state.scrollLock.acquire();
    else if (existing?.locksScroll) state.scrollLock.release();
  } else if (!existing && registration.locksScroll) {
    state.scrollLock.acquire();
  }

  const layer = state.nextLayer;
  state.nextLayer += 1;
  state.stack.push({
    ...registration,
    layer,
    closing: false,
  });
  promoteDismissableLayer(document, registration.id);
  syncInteractivity(state);
  return layer;
}

export function startDialogClose(document: Document, id: symbol): DialogCloseTransition {
  const state = getDocumentState(document);
  const entry = state.stack.find((candidate) => candidate.id === id);
  const wasTop = getTopActiveEntry(state)?.id === id;

  if (entry) entry.closing = true;
  const nextActive = getTopActiveEntry(state);
  syncInteractivity(state);

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

  if (removedEntry?.locksScroll) state.scrollLock.release();
  if (removedEntry) {
    for (const entry of state.stack) {
      entry.adoptReturnFocus(outerReturnTarget, removedEntry.wrapper);
    }
  }

  const nextInteractive = getInteractiveEntry(state);
  syncInteractivity(state);
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

  if (locksScroll) state.scrollLock.acquire();
  else state.scrollLock.release();
  entry.locksScroll = locksScroll;
}

export function isTopDialog(document: Document, id: symbol): boolean {
  return getInteractiveEntry(getDocumentState(document))?.id === id;
}
