/**
 * Vocabulario fisico do produto (SDD 7, 25.3).
 *
 * Todas as constantes de easing, duracao e deformacao vivem aqui para que
 * o carimbo, o documento e a cena 3D compartilhem o mesmo mundo fisico.
 */

/** Mola usada no carimbo: ferro batendo em papel. */
export const SPRING = {
  type: 'spring',
  stiffness: 420,
  damping: 26,
  mass: 1.1,
} as const;

/** Mola suave, para reacoes leves. */
export const SPRING_SOFT = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
} as const;

/** Curvas de easing do sistema (SDD 7.1). */
export const EASE_INK = [0.22, 1, 0.36, 1] as const;
export const EASE_METAL = [0.16, 1, 0.3, 1] as const;
export const EASE_SETTLE = [0.34, 1.56, 0.64, 1] as const;

/** Duracoes padrao, em segundos. */
export const DUR = {
  instant: 0.08,
  fast: 0.16,
  base: 0.26,
  slow: 0.45,
  stamp: 0.9,
} as const;

/** Tremor de impacto (P-SHAKE), em pixels, com decaimento exponencial. */
export const SHAKE = [0, -7, 6, -4, 2.5, -1, 0.5, 0] as const;

/** Sequencia de squash no impacto (P-SQUASH). */
export const SQUASH_SEQUENCE = [
  { scaleX: 1.24, scaleY: 0.74 },
  { scaleX: 0.93, scaleY: 1.1 },
  { scaleX: 1.02, scaleY: 0.98 },
  { scaleX: 1, scaleY: 1 },
] as const;

/** Inclinacao base do carimbo, em graus (P-TILT). */
export const STAMP_TILT_RANGE = { min: -9, max: -4 } as const;

/** Deslocamento maximo do parallax por camada, em pixels (SDD 12.1). */
export const PARALLAX_DEPTH = {
  background2d: 8,
  content: 16,
  foreground: 26,
} as const;

/**
 * Gerador pseudoaleatorio semeado (mulberry32).
 *
 * A rotacao, a granulação e a assinatura do carimbo **MUST** vir deste
 * gerador, nunca de `Math.random()`, para que o mesmo `seed` produza
 * sempre o mesmo carimbo (SDD 17.6).
 *
 * @param seed Semente inteira.
 * @returns Funcao que devolve valores em `[0, 1)`.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let t = state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
