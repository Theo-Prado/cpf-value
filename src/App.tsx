import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CpfField } from './components/CpfField';
import { CpfHero } from './components/CpfHero';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LiveRegion } from './components/LiveRegion';
import { RuleBreakdown } from './components/RuleBreakdown';
import { Scene3D } from './components/Scene3D';
import { SealEmblem } from './components/SealEmblem';
import { Stamp } from './components/Stamp';
import { usePointer } from './hooks/usePointer';
import { useReducedMotion } from './hooks/useReducedMotion';
import { formatCpf, validateCpf } from './lib/cpf';

/** CPFs de exemplo previstos em SDD 13.2. */
const SAMPLES = [
  { label: 'Válido', value: '52998224725' },
  { label: 'Válido', value: '11144477735' },
  { label: 'Dígito errado', value: '52998224726' },
  { label: 'Sequencial', value: '12345678909' },
  { label: 'Repetido', value: '11111111111' },
] as const;

/**
 * Cartorio Digital de CPF (SDD 14.1).
 *
 * Todo o CPF vive no estado do React e nunca e persistido, enviado ou
 * registrado em log (SDD 18).
 */

/** Faixa de inclinacao do papel, em graus (SDD 12.3). */
const PAPER_TILT = { rotateY: 2.2, rotateX: 1.6 } as const;

/** Deslocamento do carimbo, em pixels (SDD 12.4). */
const STAMP_PARALLAX = { x: 10, y: 7 } as const;

/**
 * Calcula a inclinacao 3D do papel a partir do ponteiro.
 *
 * Em movimento reduzido, o papel **MUST** permanecer reto (SDD 7.5).
 *
 * @param x Posicao horizontal normalizada.
 * @param y Posicao vertical normalizada.
 * @returns A string de `transform`.
 */
export function buildPaperTransform(x: number, y: number): string {
  const rotateY = x * PAPER_TILT.rotateY;
  const rotateX = -y * PAPER_TILT.rotateX;

  return `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg) translateZ(0)`;
}

/**
 * Calcula o deslocamento do carimbo a partir do ponteiro.
 *
 * @param x Posicao horizontal normalizada.
 * @param y Posicao vertical normalizada.
 * @returns A string de `transform`.
 */
export function buildStampTransform(x: number, y: number): string {
  const shiftX = x * STAMP_PARALLAX.x;
  const shiftY = y * STAMP_PARALLAX.y;

  return `translate(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px)`;
}

export function App() {
  const [value, setValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [reducedMotion, setReducedMotion] = useReducedMotion();
  const { subscribe } = usePointer();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const documentRef = useRef<HTMLElement>(null);

  // Parallax 2D: a mesma fonte de verdade da cena 3D (SDD 12.7).
  useEffect(() => {
    if (reducedMotion) {
      setParallax({ x: 0, y: 0 });

      return;
    }

    return subscribe((position) => {
      setParallax({ x: position.x, y: position.y });
    });
  }, [reducedMotion, subscribe]);

  const result = useMemo(() => validateCpf(value), [value]);

  const announcement = result.status === 'EMPTY' ? '' : result.announcement;

  const handleChange = useCallback((next: string) => {
    setCopied(false);
    setValue(next);
  }, []);

  const handleClear = useCallback(() => {
    setCopied(false);
    setValue('');
  }, []);

  const handleCopy = useCallback(() => {
    if (value.length === 0) {
      return;
    }

    const formatted = formatCpf(value);

    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(formatted).then(
        () => setCopied(true),
        () => setCopied(false),
      );
    }
  }, [value]);

  const errorMessage =
    result.status === 'EMPTY' || result.status === 'INCOMPLETE' || result.status === 'INVALID_LENGTH'
      ? null
      : result.reason;

  const isValid = result.status === 'VALID';
  const isInvalid =
    result.status === 'INVALID_DV1' ||
    result.status === 'INVALID_DV2' ||
    result.status === 'INVALID_CHARS' ||
    result.status === 'SEQUENTIAL';

  return (
    <div className="app">
      <ErrorBoundary
        fallback={<div className="scene scene__fallback" aria-hidden="true" data-testid="scene" />}
      >
        <Scene3D status={result.status} reducedMotion={reducedMotion} subscribe={subscribe} />
      </ErrorBoundary>

      <div className="vignette" aria-hidden="true" />

      <header className="masthead">
        <SealEmblem />
        <p className="masthead__eyebrow">República Federativa do Brasil</p>
        <h1 className="masthead__title">Cartório Digital de CPF</h1>
        <p className="masthead__subtitle">
          A verificação matemática do CPF acontece inteiramente neste navegador. Nada é
          enviado, gravado ou compartilhado.
        </p>
      </header>


      <section className="station" aria-labelledby="station-heading">
        <h2 id="station-heading" className="station__label">
          Estação de digitação
        </h2>

        <label className="station__label" htmlFor="cpf-input">
          CPF
        </label>

        <CpfField
          value={value}
          onChange={handleChange}
          error={errorMessage}
          onClear={handleClear}
          onCopy={handleCopy}
          canCopy={value.length > 0}
          copied={copied}
        />

        <div className="sample-row">
          <span className="sample-row__label">Amostras</span>
          {SAMPLES.map((sample) => (
            <button
              key={sample.value}
              type="button"
              className="sample-button"
              onClick={() => handleChange(formatCpf(sample.value))}
            >
              {sample.label} · {formatCpf(sample.value)}
            </button>
          ))}
        </div>
      </section>

      <div className="app__perspective">
        <article
          className="document"
          ref={documentRef}
          data-testid="document"
          style={{ transform: reducedMotion ? undefined : buildPaperTransform(parallax.x, parallax.y) }}
        >
          <header className="document__header">
            <span>Registro de Pessoas Físicas</span>
            <span>Ficha {value.length > 0 ? 'em preenchimento' : 'em branco'}</span>
          </header>

          <CpfHero value={value} reducedMotion={reducedMotion} />

          <Stamp
            status={result.status}
            cpf={result.formatted}
            seed={20260101}
            reducedMotion={reducedMotion}
            visible={result.status !== 'EMPTY'}
            announcement={announcement}
            parallaxTransform={reducedMotion ? undefined : buildStampTransform(parallax.x, parallax.y)}
          />

          <footer className="document__footer">
            <span>Emitido localmente</span>
            <span>Sem armazenamento de dados</span>
          </footer>
        </article>
      </div>

      <section className="verdict" aria-labelledby="verdict-heading">
        <h2 id="verdict-heading" className="station__label">
          Veredito
        </h2>
        <p
          className={`verdict__title${isValid ? ' verdict__title--valid' : ''}${
            isInvalid ? ' verdict__title--invalid' : ''
          }`}
          data-testid="verdict-title"
        >
          {result.status === 'VALID'
            ? 'CPF matematicamente válido'
            : result.status === 'SEQUENTIAL'
              ? 'CPF sem emissão'
              : result.status === 'INCOMPLETE'
                ? 'Aguardando o término do CPF'
                : result.status === 'EMPTY'
                  ? 'Aguardando o CPF'
                  : 'CPF não conforme'}
        </p>
        <p className="verdict__reason" data-testid="verdict-reason">
          {result.status === 'EMPTY' ? 'Digite um CPF para iniciar a análise.' : result.reason}
        </p>
      </section>

      <RuleBreakdown result={result} />

      <footer className="colophon">
        <p>
          <strong>Aviso.</strong> Este validador confere apenas a coerência aritmética dos
          dígitos verificadores e detecta números sequenciais. Ele <strong>não</strong> verifica
          se o CPF está registrado na Receita Federal nem substitui documento oficial.
        </p>
        <p>
          O CPF digitado permanece somente na memória desta aba. Recarregar a página ou fechá-la
          descarta o valor.
        </p>
        <button
          type="button"
          className="motion-toggle"
          onClick={() => setReducedMotion(!reducedMotion)}
          aria-pressed={reducedMotion}
        >
          {reducedMotion ? 'Restaurar animações' : 'Reduzir movimento'}
        </button>
      </footer>

      <LiveRegion message={announcement} />
    </div>
  );
}
