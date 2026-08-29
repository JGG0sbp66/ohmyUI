const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export interface ReducedMotionSubscription {
  matches: boolean;
  dispose: () => void;
}

export function observeReducedMotion(
  document: Document,
  onChange: (matches: boolean) => void,
): ReducedMotionSubscription {
  const view = document.defaultView;
  const matchMedia = view?.matchMedia;
  if (!view || typeof matchMedia !== "function") {
    return { matches: false, dispose: () => undefined };
  }

  let query: MediaQueryList;
  try {
    query = matchMedia.call(view, REDUCED_MOTION_QUERY);
  } catch {
    return { matches: false, dispose: () => undefined };
  }

  const handleChange = (event: MediaQueryListEvent): void => {
    onChange(Boolean(event.matches));
  };
  let removeListener: (() => void) | undefined;

  if (
    typeof query.addEventListener === "function" &&
    typeof query.removeEventListener === "function"
  ) {
    try {
      query.addEventListener("change", handleChange);
      removeListener = () => query.removeEventListener("change", handleChange);
    } catch {
      removeListener = undefined;
    }
  }

  if (
    !removeListener &&
    typeof query.addListener === "function" &&
    typeof query.removeListener === "function"
  ) {
    try {
      query.addListener(handleChange);
      removeListener = () => query.removeListener(handleChange);
    } catch {
      removeListener = undefined;
    }
  }

  let matches = false;
  try {
    matches = Boolean(query.matches);
  } catch {
    matches = false;
  }

  let disposed = false;
  return {
    matches,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      try {
        removeListener?.();
      } catch {
        // Motion preference tracking is progressive enhancement.
      }
    },
  };
}
