import { createSeededRandom, STAMP_TILT_RANGE } from './motion';

/** Textos do carimbo por estado (SDD 6.4, 13.4). */
export const STAMP_TEXTS = {
  VALID: 'SELO DE CONFORMIDADE',
  INVALID: 'NÃO CONFORME',
  SEQUENTIAL: 'CPF SEM EMISSÃO',
  INCOMPLETE: '—',
  EMPTY: '—',
  INVALID_CHARS: '—',
  INVALID_LENGTH: '—',
  INVALID_DV1: 'NÃO CONFORME',
  INVALID_DV2: 'NÃO CONFORME',
} as const;

/** Texto do anel superior. */
export const STAMP_HEADER = 'REGISTRO GERAL DE DOCUMENTOS';

/** Caracteres da arte central, por estado (identificacao sem cor). */
export const STAMP_EMBLEMS = {
  VALID: 'check',
  INVALID: 'cross',
  SEQUENTIAL: 'scratch',
  INCOMPLETE: 'none',
  EMPTY: 'none',
  INVALID_CHARS: 'none',
  INVALID_LENGTH: 'none',
  INVALID_DV1: 'cross',
  INVALID_DV2: 'cross',
} as const;

/** Parâmetros visuais derivados da semente da sessão. */
export interface StampArt {
  /** Inclinação base em graus, entre -9 e -4. */
  readonly tilt: number;
  /** Caminho SVG da assinatura manuscrita. */
  readonly signature: string;
  /** Deslocamento horizontal do grão, para variar a textura. */
  readonly grainOffset: number;
  /** Semente efetiva usada na textura. */
  readonly effectiveSeed: number;
}

/**
 * Deriva a arte do carimbo a partir da semente da sessao.
 *
 * A mesma semente **MUST** produzir sempre a mesma arte, para que o
 * carimbo seja reproduzivel e testavel (SDD 17.6).
 *
 * @param seed Semente da sessao.
 * @returns Os parametros visuais do carimbo.
 */
export function createStampArt(seed: number): StampArt {
  const random = createSeededRandom(seed);

  const tiltRange = STAMP_TILT_RANGE.max - STAMP_TILT_RANGE.min;
  const tilt = STAMP_TILT_RANGE.min + random() * tiltRange;

  const startX = 88 + random() * 10;
  const startY = 246 + random() * 8;
  const controlOneX = 118 + random() * 14;
  const controlOneY = 226 + random() * 12;
  const controlTwoX = 152 + random() * 14;
  const controlTwoY = 272 + random() * 10;
  const endX = 196 + random() * 12;
  const endY = 242 + random() * 10;

  const signature = [
    `M ${startX.toFixed(1)} ${startY.toFixed(1)}`,
    `C ${controlOneX.toFixed(1)} ${controlOneY.toFixed(1)},`,
    `${controlTwoX.toFixed(1)} ${controlTwoY.toFixed(1)},`,
    `${endX.toFixed(1)} ${endY.toFixed(1)}`,
  ].join(' ');

  return {
    tilt,
    signature,
    grainOffset: Math.floor(random() * 100),
    effectiveSeed: seed,
  };
}
