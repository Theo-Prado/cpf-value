import { motion } from 'motion/react';

interface CpfHeroProps {
  /** CPF formatado; pode estar incompleto. */
  readonly value: string;
  /** `true` quando o movimento esta reduzido. */
  readonly reducedMotion: boolean;
}

/**
 * O CPF impresso no papel (SDD 14.2).
 *
 * Cada caractere aparece com um stagger de 28ms e um jitter vertical
 * alternado, imitando o impacto de tecla da maquina de escrever.
 * O conteudo e `aria-hidden`, pois o estado ja e anunciado pela regiao
 * viva.
 */
export function CpfHero({ value, reducedMotion }: CpfHeroProps) {
  const characters = value.padEnd(14, '·').split('');

  return (
    <div className="cpf-hero" aria-hidden="true" data-testid="cpf-hero">
      {characters.map((character, index) => {
        const isSeparator = character === '.' || character === '-';
        const isPending = character === '·';

        return (
          <motion.span
            key={`${index}-${character}`}
            className={
              isPending
                ? 'cpf-hero__char--pending'
                : isSeparator
                  ? 'cpf-hero__sep'
                  : undefined
            }
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: index % 2 === 0 ? -1 : 1 }}
            animate={{ opacity: isPending ? 0.3 : 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.15 }
                : { duration: 0.18, delay: (index * 28) / 1000, ease: 'easeOut' }
            }
          >
            {character}
          </motion.span>
        );
      })}
    </div>
  );
}
