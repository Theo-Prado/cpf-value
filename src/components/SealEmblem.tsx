/**
 * Brasao em latao do cartorio (SDD 14.1).
 *
 * SVG puro, sem assets binarios e sem requisicoes de rede.
 */
export function SealEmblem() {
  return (
    <svg
      className="seal-emblem"
      viewBox="0 0 96 96"
      role="img"
      aria-label="Brasão do Cartório Digital de CPF"
    >
      <defs>
        <linearGradient id="emblem-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E7C56B" />
          <stop offset="55%" stopColor="#C8A24A" />
          <stop offset="100%" stopColor="#A8853A" />
        </linearGradient>
      </defs>

      <circle cx="48" cy="48" r="44" fill="none" stroke="url(#emblem-brass)" strokeWidth="2.5" />
      <circle cx="48" cy="48" r="37" fill="none" stroke="url(#emblem-brass)" strokeWidth="1" />

      <path
        d="M48 20 L56 39 L76 39 L60 51 L67 71 L48 59 L29 71 L36 51 L20 39 L40 39 Z"
        fill="url(#emblem-brass)"
        opacity="0.9"
      />

      <circle cx="48" cy="48" r="4.5" fill="#17120D" />
    </svg>
  );
}
