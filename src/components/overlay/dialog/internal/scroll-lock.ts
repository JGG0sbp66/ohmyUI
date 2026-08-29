interface BodyStyleSnapshot {
  overflow: string;
  paddingRight: string;
}

export interface ScrollLockController {
  acquire: () => void;
  release: () => void;
}

export function createScrollLock(document: Document): ScrollLockController {
  let count = 0;
  let bodyStyleSnapshot: BodyStyleSnapshot | undefined;

  function acquire(): void {
    count += 1;
    if (count > 1) return;

    const body = document.body;
    const view = document.defaultView;
    if (!body || !view) return;

    bodyStyleSnapshot = {
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

  function release(): void {
    count = Math.max(0, count - 1);
    if (count > 0) return;

    const body = document.body;
    if (body && bodyStyleSnapshot) {
      body.style.overflow = bodyStyleSnapshot.overflow;
      body.style.paddingRight = bodyStyleSnapshot.paddingRight;
    }
    bodyStyleSnapshot = undefined;
  }

  return { acquire, release };
}
