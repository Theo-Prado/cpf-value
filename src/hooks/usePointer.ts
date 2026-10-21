import { useCallback, useEffect, useRef } from 'react';

/** Posicao normalizada do ponteiro, em `[-1, 1]`. */
export interface PointerPosition {
  x: number;
  y: number;
}

/** Assinante de callbacks de paralaxe. */
export type PointerSubscriber = (position: PointerPosition) => void;

/**
 * Normaliza a posicao do ponteiro e a distribui para os assinantes.
 *
 * O valor e suavizado por `lerp` exponencial e nunca aplicado
 * diretamente no handler de `pointermove` (SDD 12.2).
 *
 * @returns Uma ref com o valor corrente e a funcao de inscricao.
 */
export function usePointer(): {
  readonly position: React.RefObject<PointerPosition>;
  readonly subscribe: (subscriber: PointerSubscriber) => () => void;
} {
  const position = useRef<PointerPosition>({ x: 0, y: 0 });
  const subscribers = useRef<Set<PointerSubscriber>>(new Set());
  const target = useRef<PointerPosition>({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      target.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };

      if (frame.current === null) {
        frame.current = window.requestAnimationFrame(apply);
      }
    };

    const apply = () => {
      frame.current = null;

      const current = position.current;
      const next = target.current;

      current.x += (next.x - current.x) * 0.12;
      current.y += (next.y - current.y) * 0.12;

      for (const subscriber of subscribers.current) {
        subscriber(current);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);

      if (frame.current !== null) {
        window.cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    };
  }, []);

  const subscribe = useCallback((subscriber: PointerSubscriber) => {
    subscribers.current.add(subscriber);

    return () => {
      subscribers.current.delete(subscriber);
    };
  }, []);

  return { position, subscribe };
}
