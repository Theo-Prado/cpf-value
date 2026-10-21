import { useEffect, useRef, useState } from 'react';

import type { CpfStatus } from '../lib/cpf';
import type { PointerSubscriber } from '../hooks/usePointer';
import type { SceneController } from '../three/scene';

interface Scene3DProps {
  /** Estado refletido pela cena. */
  readonly status: CpfStatus;
  /** `true` quando o movimento esta reduzido. */
  readonly reducedMotion: boolean;
  /** Inscricao do ponteiro, compartilhada com o parallax 2D. */
  readonly subscribe: (subscriber: PointerSubscriber) => () => void;
}

/**
 * A cena 3D (SDD 11).
 *
 * O Three.js e carregado sob demanda (`import()` dinamico) para nao
 * pesar no bundle inicial. Se o WebGL nao estiver disponivel, o
 * fallback CSS assume e o restante da interface funciona igual.
 */
export function Scene3D({ status, reducedMotion, subscribe }: Scene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SceneController | null>(null);
  const [supported, setSupported] = useState(true);

  // Montagem: cria a cena uma unica vez.
  useEffect(() => {
    const container = containerRef.current;

    if (container === null) {
      return;
    }

    let cancelled = false;

    const start = async () => {
      try {
        const { createScene } = await import('../three/scene');

        if (cancelled) {
          return;
        }

        const controller = createScene({ container, status, reducedMotion });

        if (controller === null) {
          setSupported(false);

          return;
        }

        controllerRef.current = controller;
      } catch (error) {
        console.error('Falha ao iniciar a cena 3D:', error);
        setSupported(false);
      }
    };

    void start();

    return () => {
      cancelled = true;
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Reacao ao estado, sem recriar a cena.
  useEffect(() => {
    controllerRef.current?.setStatus(status);
  }, [status]);

  // Paralaxe: a mesma fonte de verdade do parallax 2D (SDD 12.7).
  useEffect(() => {
    return subscribe((position) => {
      controllerRef.current?.setPointer(position.x, position.y);
    });
  }, [subscribe]);

  return (
    <div className="scene" aria-hidden="true" data-testid="scene">
      <div className="scene__fallback" style={{ opacity: supported ? 0.5 : 1 }} />
      <div ref={containerRef} className="scene__container" />
    </div>
  );
}

