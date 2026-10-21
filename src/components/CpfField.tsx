import { useRef, useState } from 'react';

import { formatCpf, onlyDigits } from '../lib/cpf';

interface CpfFieldProps {
  /** Valor atual do campo, ja formatado. */
  readonly value: string;
  /** Notifica a alteracao do valor (sempre formatado). */
  readonly onChange: (formatted: string) => void;
  /** Mensagem de erro a exibir abaixo do campo. */
  readonly error?: string | null;
  /** Rotulo acessivel do botao de limpeza. */
  readonly onClear: () => void;
  /** Rotulo acessivel do botao de copia. */
  readonly onCopy: () => void;
  /** `true` quando ha algo para copiar. */
  readonly canCopy: boolean;
  /** `true` quando a copia foi concluida com sucesso. */
  readonly copied: boolean;
}

/**
 * Campo de digitacao do CPF (SDD 14.2).
 *
 * A mascara e aplicada no `onChange`, o que mantem o cursor no fim do
 * texto — a pontuacao cresce para a direita, nunca no meio.
 */
export function CpfField({
  value,
  onChange,
  error,
  onClear,
  onCopy,
  canCopy,
  copied,
}: CpfFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatCpf(onlyDigits(event.target.value)));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && value.length > 0) {
      event.preventDefault();
      onClear();
    }
  };

  const errorId = 'cpf-field-error';

  return (
    <div className="cpf-field">
      <div className="cpf-field__control">
        <input
          ref={inputRef}
          id="cpf-input"
          className="cpf-field__input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          maxLength={14}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder="000.000.000-00"
        />
        {focused && value.length < 14 ? (
          <span className="cpf-field__successor" aria-hidden="true" />
        ) : null}
        <div className="cpf-field__buttons">
          <button
            type="button"
            className="icon-button"
            onClick={onClear}
            disabled={value.length === 0}
            aria-label="Limpar o CPF digitado"
          >
            Limpar
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onCopy}
            disabled={!canCopy}
            aria-label="Copiar o CPF formatado"
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
      {error ? (
        <p className="cpf-field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
