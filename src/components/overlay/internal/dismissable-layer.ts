export interface DismissableLayerRegistration {
  id: symbol;
  isActive: () => boolean;
  /** 返回 true 表示本层消费了 Escape。最上层返回 false 时也不会穿透到下层。 */
  onEscape: (event: KeyboardEvent) => boolean;
}

interface DismissableLayerEntry extends DismissableLayerRegistration {}

interface DocumentLayerState {
  entries: DismissableLayerEntry[];
  handleKeydown: (event: KeyboardEvent) => void;
}

const documentStates = new WeakMap<Document, DocumentLayerState>();

function findTopActiveEntry(
  entries: readonly DismissableLayerEntry[],
): DismissableLayerEntry | undefined {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry?.isActive()) return entry;
  }
  return undefined;
}

function getDocumentState(document: Document): DocumentLayerState {
  const existing = documentStates.get(document);
  if (existing) return existing;

  const state: DocumentLayerState = {
    entries: [],
    handleKeydown: (event) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing) return;

      const entry = findTopActiveEntry(state.entries);
      if (!entry) return;

      if (entry.onEscape(event)) event.preventDefault();
    },
  };

  document.addEventListener("keydown", state.handleKeydown);
  documentStates.set(document, state);
  return state;
}

/**
 * 将浮层加入当前 Document 的关闭栈。同一时刻只有最上层 active entry 会收到 Escape。
 */
export function registerDismissableLayer(
  document: Document,
  registration: DismissableLayerRegistration,
): () => void {
  const state = getDocumentState(document);
  const duplicateIndex = state.entries.findIndex((entry) => entry.id === registration.id);
  if (duplicateIndex >= 0) state.entries.splice(duplicateIndex, 1);

  const entry: DismissableLayerEntry = { ...registration };
  state.entries.push(entry);

  let registered = true;
  return () => {
    if (!registered) return;
    registered = false;

    const currentState = documentStates.get(document);
    if (!currentState) return;

    const index = currentState.entries.indexOf(entry);
    if (index >= 0) currentState.entries.splice(index, 1);
    if (currentState.entries.length > 0) return;

    document.removeEventListener("keydown", currentState.handleKeydown);
    documentStates.delete(document);
  };
}

/** 让已注册的浮层重新成为当前 Escape 栈顶，不创建新的监听器。 */
export function promoteDismissableLayer(document: Document, id: symbol): void {
  const state = documentStates.get(document);
  if (!state) return;

  const index = state.entries.findIndex((entry) => entry.id === id);
  if (index < 0 || index === state.entries.length - 1) return;

  const [entry] = state.entries.splice(index, 1);
  if (entry) state.entries.push(entry);
}
