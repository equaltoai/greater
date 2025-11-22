import type { Action } from 'svelte/action';

interface InfiniteScrollOptions {
  /**
   * Return true to skip invoking the callback while conditions (e.g. loading) are active.
   */
  disabled?: () => boolean;
  /**
   * Root margin for the IntersectionObserver.
   *
   * Defaults to `0px 0px 200px 0px` so we load slightly before the sentinel becomes fully visible.
   */
  rootMargin?: string;
  /**
   * Threshold passed to the IntersectionObserver.
   */
  threshold?: number;
  /**
   * Optional root element for the IntersectionObserver.
   */
  root?: Element | Document | null;
}

/**
 * Create a Svelte action that triggers the provided callback whenever the target node enters view.
 * The callback won't run when `disabled()` returns true.
 */
export function createInfiniteScrollAction(
  callback: () => void | Promise<void>,
  options: InfiniteScrollOptions = {}
): Action<HTMLElement, void> {
  return (node) => {
    if (typeof window === 'undefined' || !node) {
      return {
        destroy: () => undefined,
      };
    }

    if (typeof IntersectionObserver === 'undefined') {
      return {
        destroy: () => undefined,
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (options.disabled?.()) continue;
          void callback();
        }
      },
      {
        root: options.root ?? null,
        rootMargin: options.rootMargin ?? '0px 0px 200px 0px',
        threshold: options.threshold ?? 0,
      }
    );

    observer.observe(node);

    return {
      destroy() {
        observer.disconnect();
      },
    };
  };
}

