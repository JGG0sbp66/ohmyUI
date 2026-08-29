export interface ReadonlyCopyCallbacks {
  onSuccess: (value: string) => void;
  onError: (error: unknown) => void;
}

type SelectableControl = HTMLInputElement | HTMLTextAreaElement;

/**
 * 在用户 click 手势内先保留选区，再尝试写入控件所属 Window 的剪贴板。
 * Clipboard API 不可用或被拒绝时不清除选区，调用方仍可提示用户手动复制。
 */
export async function selectAndCopyReadonlyControl(
  event: MouseEvent,
  callbacks: ReadonlyCopyCallbacks,
): Promise<void> {
  const control = event.currentTarget as SelectableControl | null;
  if (!control || control.disabled || !control.readOnly) return;

  try {
    control.select();
  } catch {
    // 某些 input type 不支持 select；仍继续复制当前展示值。
  }

  const value = control.value;
  if (!value) return;

  try {
    const clipboard = control.ownerDocument.defaultView?.navigator.clipboard;
    if (!clipboard?.writeText) throw new Error("Clipboard API is unavailable");

    await clipboard.writeText(value);
    callbacks.onSuccess(value);
  } catch (error) {
    callbacks.onError(error);
  }
}
