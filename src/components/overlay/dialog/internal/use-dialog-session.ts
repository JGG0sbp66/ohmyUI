import { computed, ref, shallowRef } from "vue";
import type { CSSProperties, Ref } from "vue";

import { isHtmlElement } from "./dialog-dom";

type TeleportedThemeStyle = CSSProperties & { "--app-hue"?: string };

interface UseDialogSessionOptions {
  originRef: Ref<HTMLElement | null>;
  teleportTo: () => string | HTMLElement;
}

export function useDialogSession({ originRef, teleportTo }: UseDialogSessionOptions) {
  const teleportTarget = shallowRef<string | HTMLElement>();
  const themeScope = ref<"light" | "dark" | undefined>();
  const themeStyle = ref<TeleportedThemeStyle>({});
  const resolvedTeleportTarget = computed<string | HTMLElement>(
    () => teleportTarget.value ?? teleportTo(),
  );

  let generation = 0;
  let disposed = false;

  function resolveTeleportTarget(): string | HTMLElement {
    const requestedTarget = teleportTo();
    const sourceDocument =
      originRef.value?.ownerDocument ?? (typeof document === "undefined" ? null : document);
    if (!sourceDocument) return requestedTarget;

    let targetElement: Element | null = null;
    try {
      targetElement =
        typeof requestedTarget === "string"
          ? sourceDocument.querySelector(requestedTarget)
          : isHtmlElement(requestedTarget)
            ? requestedTarget
            : null;
    } catch {
      return sourceDocument.body;
    }

    if (!isHtmlElement(targetElement) || !targetElement.isConnected) return sourceDocument.body;
    if (targetElement.closest("[data-ohmyui-dialog-layer]")) {
      return targetElement.ownerDocument.body;
    }
    return targetElement;
  }

  function lockTeleportTarget(): void {
    if (teleportTarget.value !== undefined) return;
    teleportTarget.value = resolveTeleportTarget();
  }

  function releaseTeleportTarget(): void {
    teleportTarget.value = undefined;
  }

  function hasLockedTeleportTarget(): boolean {
    return teleportTarget.value !== undefined;
  }

  function resolveTeleportDocument(): Document | null {
    const target = resolvedTeleportTarget.value;
    if (typeof target !== "string" && isHtmlElement(target)) return target.ownerDocument;
    return originRef.value?.ownerDocument ?? (typeof document === "undefined" ? null : document);
  }

  function captureThemeContext(): void {
    const origin = originRef.value;
    const scope = origin?.closest(".light, .dark");
    themeScope.value = scope?.classList.contains("dark")
      ? "dark"
      : scope?.classList.contains("light")
        ? "light"
        : undefined;

    const view = origin?.ownerDocument.defaultView;
    const hue =
      origin && view ? view.getComputedStyle(origin).getPropertyValue("--app-hue").trim() : "";
    themeStyle.value = hue ? { "--app-hue": hue } : {};
  }

  function clearThemeContext(): void {
    themeScope.value = undefined;
    themeStyle.value = {};
  }

  function beginOpenAttempt(): number {
    lockTeleportTarget();
    generation += 1;
    return generation;
  }

  function invalidateAttempt(): number {
    generation += 1;
    return generation;
  }

  function isCurrentAttempt(candidate: number): boolean {
    return !disposed && candidate === generation;
  }

  function dispose(): void {
    disposed = true;
    generation += 1;
  }

  return {
    beginOpenAttempt,
    captureThemeContext,
    clearThemeContext,
    dispose,
    hasLockedTeleportTarget,
    invalidateAttempt,
    isCurrentAttempt,
    lockTeleportTarget,
    releaseTeleportTarget,
    resolveTeleportDocument,
    resolvedTeleportTarget,
    themeScope,
    themeStyle,
  };
}
