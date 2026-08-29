export interface DismissableLayerRegistration {
  id: symbol;
  isActive: () => boolean;
  /** 返回 true 表示本层消费了 Escape。最上层返回 false 时也不会穿透到下层。 */
  onEscape: (event: KeyboardEvent) => boolean;
  /** trigger、panel 及属于当前层的 portal；命中其中任一节点都不算 outside。 */
  getContainers?: () => readonly (HTMLElement | null)[];
  /** 未提供此回调的层不参与 pointer outside 仲裁，但仍可占用 Escape 栈顶。 */
  onPointerDownOutside?: (event: PointerEvent) => void;
}

interface DismissableLayerEntry extends DismissableLayerRegistration {}

interface DocumentLayerState {
  entries: DismissableLayerEntry[];
  handleKeydown: (event: KeyboardEvent) => void;
  handlePointerDown: (event: PointerEvent) => void;
}

const documentStates = new WeakMap<Document, DocumentLayerState>();

function findTopActiveEntry(
  entries: readonly DismissableLayerEntry[],
  participates: (entry: DismissableLayerEntry) => boolean = () => true,
): DismissableLayerEntry | undefined {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry?.isActive() && participates(entry)) return entry;
  }
  return undefined;
}

function isInsideLayer(event: PointerEvent, entry: DismissableLayerEntry): boolean {
  const containers = entry.getContainers?.().filter((container) => container?.isConnected) ?? [];
  if (containers.length === 0) return false;

  const path = event.composedPath();
  return containers.some(
    (container) =>
      container && (path.includes(container) || container.contains(event.target as Node)),
  );
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
    handlePointerDown: (event) => {
      if (event.defaultPrevented || !event.isPrimary || event.button !== 0) return;

      // Escape-only 的 Tooltip 不应吞掉下层 modal 的 backdrop；显式提供 no-op
      // outside handler 的层仍会有意阻断下穿，保证一次 pointer 最多处理一层。
      const entry = findTopActiveEntry(
        state.entries,
        (candidate) => candidate.onPointerDownOutside !== undefined,
      );
      if (!entry?.onPointerDownOutside || isInsideLayer(event, entry)) return;
      entry.onPointerDownOutside(event);
    },
  };

  document.addEventListener("keydown", state.handleKeydown);
  document.addEventListener("pointerdown", state.handlePointerDown, true);
  documentStates.set(document, state);
  return state;
}

/** 将浮层加入当前 Document 的关闭栈；每种事件只通知最上层参与者。 */
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
    document.removeEventListener("pointerdown", currentState.handlePointerDown, true);
    documentStates.delete(document);
  };
}

/** 让已注册的浮层重新成为当前关闭栈顶，不创建新的监听器。 */
export function promoteDismissableLayer(document: Document, id: symbol): void {
  const state = documentStates.get(document);
  if (!state) return;

  const index = state.entries.findIndex((entry) => entry.id === id);
  if (index < 0 || index === state.entries.length - 1) return;

  const [entry] = state.entries.splice(index, 1);
  if (entry) state.entries.push(entry);
}
