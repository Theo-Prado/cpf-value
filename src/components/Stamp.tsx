import { motion } from 'motion/react';

import type { CpfStatus } from '../lib/cpf';
import { STAMP_EMBLEMS, STAMP_HEADER, STAMP_TEXTS, createStampArt } from '../lib/stamp';
import { EASE_INK, SHAKE, SPRING, SQUASH_SEQUENCE } from '../lib/motion';

interface StampProps {
  /** Estado que define a arte do carimbo. */
  readonly status: CpfStatus;
  /** CPF formatado a estampar. */
  readonly cpf: string;
  /** Semente da sessao, para reproduzir a arte. */
  readonly seed: number;
  /** `true` quando o movimento esta reduzido. */
  readonly reducedMotion: boolean;
  /** `true` quando o carimbo deve entrar em cena. */
  readonly visible: boolean;
  /** Frase unica que descreve o resultado. */
  readonly announcement: string;
  /** Deslocamento de parallax ja calculado pela camada 2D. */
  readonly parallaxTransform?: string;
}
/**
 * O carimbo — protagonista visual do produto (SDD 6.4, 14.2).
 *
 * A forma do carimbo carrega a informacao junto com o texto: anel
 * fechado para conformidade, anel cortado para nao conformidade e
 * marca de risco para numeros sequenciais. Assim o resultado continua
 * identificavel em escala de cinza (SDD 15.7).
 */
export function Stamp({
  status,
  cpf,
  seed,
  reducedMotion,
  visible,
  announcement,
  parallaxTransform,
}: StampProps) {
  const art = createStampArt(seed);
  const text = STAMP_TEXTS[status];
  const emblem = STAMP_EMBLEMS[status];

  const isEmpty = status === 'EMPTY';
  const isGhost = status === 'INCOMPLETE';
  const isValid = status === 'VALID';
  const isSequential = status === 'SEQUENTIAL';

  const variant = isValid ? 'valid' : isSequential ? 'sequential' : 'invalid';

  if (!visible || isEmpty) {
    return <div className="stamp stamp--hidden" data-testid="stamp" data-status={status} />;
  }

  // A queda termina em `1.35 → 1`; o squash (P-SQUASH) fecha a coreografia.
  const squashKeyframes = reducedMotion
    ? { scaleX: 1, scaleY: 1 }
    : {
        scaleX: SQUASH_SEQUENCE.map((frame) => frame.scaleX),
        scaleY: SQUASH_SEQUENCE.map((frame) => frame.scaleY),
      };

  return (
    <motion.div
      className={`stamp stamp--${variant}${isGhost ? ' stamp--ghost' : ''}`}
      data-testid="stamp"
      data-status={status}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.35, y: -120 }}
      animate={
        reducedMotion
          ? { opacity: isGhost ? 0.2 : 1, scale: 1, y: 0, rotate: art.tilt }
          : {
              opacity: isGhost ? 0.2 : 1,
              scale: 1,
              y: 0,
              rotate: art.tilt,
              ...squashKeyframes,
            }
      }
      transition={
        reducedMotion
          ? { duration: 0.15, ease: 'linear' }
          : {
              type: 'spring',
              stiffness: SPRING.stiffness,
              damping: SPRING.damping,
              mass: SPRING.mass,
              scaleX: { duration: 0.32, ease: 'easeOut' },
              scaleY: { duration: 0.32, ease: 'easeOut' },
            }
      }
    >
      <div style={{ transform: parallaxTransform }}>
        <motion.svg
          className="stamp__svg"
          viewBox="0 0 320 320"
          role="img"
          aria-label={announcement}
          animate={
            reducedMotion
              ? undefined
              : { x: SHAKE.map((value) => value * 0.6), y: SHAKE.map((value) => value) }
          }
          transition={reducedMotion ? undefined : { duration: 0.42, ease: 'linear' }}
        >
        <defs>
          <filter id="stamp-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9 0.35"
              numOctaves={3}
              seed={art.effectiveSeed}
              result="noise"
            />
            <feColorMatrix in="noise" type="saturate" values="0" result="desaturated" />
            <feComposite in="desaturated" in2="SourceGraphic" operator="in" />
          </filter>

          <filter id="stamp-rough">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves={3}
              seed={art.effectiveSeed}
              result="warp"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="warp"
              scale="4"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <path id="stamp-arc-top" d="M 60 160 A 100 100 0 0 1 260 160" />
          <path id="stamp-arc-bottom" d="M 62 168 A 98 98 0 0 0 258 168" />
        </defs>

        <g className="stamp__body" filter="url(#stamp-rough)">
          <rect className="stamp__ring" x="8" y="8" width="304" height="304" rx="6" />
          <rect className="stamp__ring stamp__ring--inner" x="18" y="18" width="284" height="284" rx="4" />
        </g>

        {isSequential ? (
          <path
            className="stamp__signature"
            d="M 40 200 L 280 130"
            strokeDasharray="8 6"
            strokeWidth="3"
          />
        ) : null}

        <g filter="url(#stamp-grain)">
          <text className="stamp__text">
            <textPath href="#stamp-arc-top" startOffset="50%" textAnchor="middle">
              {STAMP_HEADER}
            </textPath>
          </text>

          <text className="stamp__text" x="160" y="150" textAnchor="middle">
            {text}
          </text>

          {emblem === 'check' ? (
            <path
              className="stamp__signature"
              d="M 120 176 L 146 202 L 200 148"
              strokeWidth="7"
            />
          ) : null}

          {emblem === 'cross' ? (
            <g className="stamp__signature" strokeWidth="7">
              <line x1="126" y1="166" x2="194" y2="212" />
              <line x1="194" y1="166" x2="126" y2="212" />
            </g>
          ) : null}

          {emblem === 'scratch' ? (
            <path className="stamp__signature" d="M 110 190 L 210 170" strokeWidth="6" />
          ) : null}

          <text className="stamp__text" x="160" y="238" textAnchor="middle" fontSize="13">
            {cpf || '—'}
          </text>

          <text className="stamp__text">
            <textPath href="#stamp-arc-bottom" startOffset="50%" textAnchor="middle">
              BRASIL · CARTÓRIO DIGITAL
            </textPath>
          </text>
        </g>

        <motion.path
          className="stamp__signature"
          d={art.signature}
          initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={
            reducedMotion
              ? { duration: 0.15 }
              : { duration: 0.55, ease: EASE_INK, delay: 0.12 }
          }
        />
        </motion.svg>
      </div>
    </motion.div>
  );
}
