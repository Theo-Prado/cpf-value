import '@testing-library/jest-dom/vitest';

/**
 * O jsdom nao implementa `matchMedia`, usado pela deteccao de
 * `prefers-reduced-motion` (SDD 15.5). O stub abaixo permite que a
 * interface seja testada de forma deterministica.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

/** `ResizeObserver` e usado pela cena 3D; o jsdom tambem nao o implementa. */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    public observe(): void {
      // Observacao nao é necessária nos testes.
    }

    public unobserve(): void {
      // Observacao nao é necessária nos testes.
    }

    public disconnect(): void {
      // Observacao nao é necessária nos testes.
    }
  } as unknown as typeof ResizeObserver;
}

