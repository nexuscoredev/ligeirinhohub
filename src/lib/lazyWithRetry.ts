import { lazy, type ComponentType } from 'react';

export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload();
      return new Promise(() => {});
    }),
  );
}
