import { computed, onBeforeUnmount, onMounted, ref, type ComputedRef } from "vue";

import type { AdaptivePresentation } from "./selection.types";

interface AdaptivePresentationState {
  isSheet: ComputedRef<boolean>;
}

/** SSR 安全的呈现选择；与 Tailwind 的 sm=640px 断点保持一致。 */
export function useAdaptivePresentation(
  presentation: () => AdaptivePresentation,
): AdaptivePresentationState {
  const mobileViewport = ref(false);
  let mediaQuery: MediaQueryList | undefined;

  const isSheet = computed(() => {
    const requested = presentation();
    if (requested === "sheet") return true;
    if (requested === "popover") return false;
    return mobileViewport.value;
  });

  function sync(event?: MediaQueryListEvent): void {
    mobileViewport.value = event?.matches ?? mediaQuery?.matches ?? false;
  }

  onMounted(() => {
    if (typeof window === "undefined") return;
    mediaQuery = window.matchMedia("(max-width: 639px)");
    sync();
    mediaQuery.addEventListener("change", sync);
  });

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener("change", sync);
    mediaQuery = undefined;
  });

  return { isSheet };
}
