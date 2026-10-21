interface LiveRegionProps {
  /** Frase a anunciar; muda apenas quando o estado muda. */
  readonly message: string;
}

/**
 * Regiao viva da aplicacao (SDD 15.4).
 *
 * E `polite` para nunca interromper o usuario, `atomic` para anunciar a
 * frase inteira e `sr-only` para nao duplicar visualmente a informacao.
 */
export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true" data-testid="live-region">
      {message}
    </div>
  );
}
