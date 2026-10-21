/**
 * Nucleo canonico de validacao de CPF (SDD 13).
 *
 * Este modulo e a unica fonte de verdade do projeto. Todas as regras
 * abaixo sao implementadas aqui, de forma pura e deterministica:
 *
 *  - nao acessa rede, storage, `Date` ou `Math.random`;
 *  - nao lanca excecoes (entradas invalidas viram `status`);
 *  - nao depende de estado global;
 *  - mantem o CPF exclusivamente em memoria (SDD 18).
 *
 * A API pública e a descrita em SDD 13.5.
 */

/** Quantidade total de digitos de um CPF. */
export const CPF_LENGTH = 11;

/** Quantidade de digitos da base (sem os dois digitos verificadores). */
export const CPF_BASE_LENGTH = 9;

/**
 * Pesos do primeiro digito verificador: o digito de indice `i` (base zero)
 * recebe o peso `10 - i`.
 */
export const FIRST_CHECK_WEIGHTS: readonly number[] = [10, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Pesos do segundo digito verificador: calculados sobre os dez digitos
 * (base + DV1), com peso `11 - i`.
 */
export const SECOND_CHECK_WEIGHTS: readonly number[] = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Caracteres aceitos como separadores de mascara, alem dos digitos.
 * Entradas formatadas (`529.982.247-25`) sao normalizadas antes da
 * validacao; qualquer outro caractere produz `INVALID_CHARS`.
 */
const ALLOWED_SEPARATORS = new Set(['.', '-', ' ', '/', '\u2010', '\u2011', '\u2012', '\u2013', '\u2014']);

/** Estados de validacao previstos em SDD 13.4. */
export type CpfStatus =
  | 'EMPTY'
  | 'INCOMPLETE'
  | 'INVALID_CHARS'
  | 'INVALID_LENGTH'
  | 'INVALID_DV1'
  | 'INVALID_DV2'
  | 'SEQUENTIAL'
  | 'VALID';

/** Digitos verificadores calculados e encontrados. */
export interface CpfCheckDigits {
  readonly dv1: number;
  readonly dv2: number;
}

/** Resultado completo de uma analise de CPF. */
export interface CpfResult {
  /** Estado da analise. */
  readonly status: CpfStatus;
  /** `true` apenas para `VALID`. */
  readonly isValid: boolean;
  /** CPF formatado; parcial enquanto incompleto. */
  readonly formatted: string;
  /** Apenas digitos, limitado a 11. */
  readonly digits: string;
  /** DVs esperados, quando o calculo foi possivel. */
  readonly expected: CpfCheckDigits | null;
  /** DVs presentes na entrada, quando o calculo foi possivel. */
  readonly found: CpfCheckDigits | null;
  /** Micro-copy pronta para exibicao. */
  readonly reason: string;
  /** Frase unica para a regiao viva (`aria-live`). */
  readonly announcement: string;
}

/**
 * Remove todos os caracteres nao numericos.
 *
 * @param input Texto de origem.
 * @returns Sequencia de digitos, com no maximo 11 caracteres.
 */
export function onlyDigits(input: string): string {
  return input.replace(/\D/g, '').slice(0, CPF_LENGTH);
}

/**
 * Aplica a mascara oficial `000.000.000-00` de forma progressiva.
 *
 * Números parciais recebem pontuacao apenas ate o ultimo digito
 * informado, para que a mascara acompanhe a digitacao.
 *
 * @param input Texto de origem (formatado ou nao).
 * @returns Texto formatado.
 */
export function formatCpf(input: string): string {
  const digits = onlyDigits(input);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Indica se a base de nove digitos e homogenea ou forma uma progressao
 * aritmetica de razao +-1 (SDD 13.3).
 *
 * @param digits Sequencia de digitos (apenas a base e relevante).
 * @returns `true` quando a base nao corresponde a um numero emitido.
 */
export function isSequential(digits: string): boolean {
  const base = digits.replace(/\D/g, '').slice(0, CPF_BASE_LENGTH);

  if (base.length < CPF_BASE_LENGTH) {
    return false;
  }

  const values = base.split('').map((character) => Number.parseInt(character, 10));

  const allEqual = values.every((value) => value === values[0]);

  if (allEqual) {
    return true;
  }

  const step = values[1] - values[0];

  if (step !== 1 && step !== -1) {
    return false;
  }

  return values.every((value, index) => value === (values[0] + step * index) % 10);
}

/**
 * Calcula um digito verificador modulo 11 sobre os digitos informados.
 *
 * @param digits Digitos da base, em ordem.
 * @param weights Pesos a aplicar.
 * @returns O digito verificador calculado (0 quando o resto e 0, 1 ou 10).
 */
function computeCheckDigit(digits: readonly number[], weights: readonly number[]): number {
  let sum = 0;

  for (let index = 0; index < digits.length; index += 1) {
    sum += digits[index] * weights[index];
  }

  const remainder = sum % 11;

  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Verifica se a entrada contem apenas digitos e separadores de mascara
 * aceitos.
 *
 * @param input Texto de origem.
 * @returns `true` quando nenhum caractere proibido foi encontrado.
 */
function hasOnlyAllowedCharacters(input: string): boolean {
  for (const character of input) {
    if (character >= '0' && character <= '9') {
      continue;
    }

    if (ALLOWED_SEPARATORS.has(character)) {
      continue;
    }

    return false;
  }

  return true;
}


/**
 * Analisa um CPF informado pelo usuario.
 *
 * A funcao e pura: nao le `Date`, nao usa `Math.random`, nao lanca
 * excecoes e nao produz efeitos colaterais. Todo CPF invalido e
 * reportado por meio de `status` e `reason`.
 *
 * @param input Texto digitado, formatado ou nao.
 * @returns O resultado completo da analise.
 */
export function validateCpf(input: string): CpfResult {
  const safeInput = typeof input === 'string' ? input : '';

  if (safeInput.trim().length === 0) {
    return {
      status: 'EMPTY',
      isValid: false,
      formatted: '',
      digits: '',
      expected: null,
      found: null,
      reason: 'Nenhum CPF foi informado.',
      announcement: 'Campo vazio. Informe um CPF para iniciar a análise.',
    };
  }

  if (!hasOnlyAllowedCharacters(safeInput)) {
    return {
      status: 'INVALID_CHARS',
      isValid: false,
      formatted: formatCpf(safeInput),
      digits: onlyDigits(safeInput),
      expected: null,
      found: null,
      reason: 'O CPF deve conter apenas números.',
      announcement: 'CPF inválido: o número deve conter apenas algarismos.',
    };
  }

  const allDigits = safeInput.replace(/\D/g, '');

  if (allDigits.length > CPF_LENGTH) {
    return {
      status: 'INVALID_LENGTH',
      isValid: false,
      formatted: formatCpf(safeInput),
      digits: allDigits.slice(0, CPF_LENGTH),
      expected: null,
      found: null,
      reason: `O CPF tem 11 dígitos; você digitou ${allDigits.length}.`,
      announcement: `CPF inválido: foram digitados ${allDigits.length} dígitos, mas o CPF tem 11.`,
    };
  }

  if (allDigits.length < CPF_LENGTH) {
    const missing = CPF_LENGTH - allDigits.length;

    return {
      status: 'INCOMPLETE',
      isValid: false,
      formatted: formatCpf(safeInput),
      digits: allDigits,
      expected: null,
      found: null,
      reason: `Faltam ${missing} dígito${missing === 1 ? '' : 's'}.`,
      announcement: `CPF incompleto: faltam ${missing} dígito${missing === 1 ? '' : 's'}.`,
    };
  }

  const base = allDigits.slice(0, CPF_BASE_LENGTH);
  const baseDigits = base.split('').map((character) => Number.parseInt(character, 10));

  const foundDv1 = Number.parseInt(allDigits[9], 10);
  const foundDv2 = Number.parseInt(allDigits[10], 10);

  const expectedDv1 = computeCheckDigit(baseDigits, FIRST_CHECK_WEIGHTS);
  const expectedDv2 = computeCheckDigit([...baseDigits, expectedDv1], SECOND_CHECK_WEIGHTS);

  const expected: CpfCheckDigits = { dv1: expectedDv1, dv2: expectedDv2 };
  const found: CpfCheckDigits = { dv1: foundDv1, dv2: foundDv2 };

  if (expectedDv1 !== foundDv1) {
    return {
      status: 'INVALID_DV1',
      isValid: false,
      formatted: formatCpf(safeInput),
      digits: allDigits,
      expected,
      found,
      reason: `O 10º dígito verificador esperado é ${expectedDv1}, mas foi ${foundDv1}.`,
      announcement: `CPF não conforme: o décimo dígito verificador esperado é ${expectedDv1}, mas foi ${foundDv1}.`,
    };
  }

  if (expectedDv2 !== foundDv2) {
    return {
      status: 'INVALID_DV2',
      isValid: false,
      formatted: formatCpf(safeInput),
      digits: allDigits,
      expected,
      found,
      reason: `O 11º dígito verificador esperado é ${expectedDv2}, mas foi ${foundDv2}.`,
      announcement: `CPF não conforme: o décimo primeiro dígito verificador esperado é ${expectedDv2}, mas foi ${foundDv2}.`,
    };
  }

  if (isSequential(base)) {
    return {
      status: 'SEQUENTIAL',
      isValid: false,
      formatted: formatCpf(safeInput),
      digits: allDigits,
      expected,
      found,
      reason:
        'Os dígitos conferem, mas o número é sequencial — a Receita Federal nunca emitiu este CPF.',
      announcement:
        'CPF sequencial: os dígitos conferem, mas a Receita Federal nunca emitiu este número.',
    };
  }

  return {
    status: 'VALID',
    isValid: true,
    formatted: formatCpf(safeInput),
    digits: allDigits,
    expected,
    found,
    reason: 'Os dígitos verificadores conferem.',
    announcement: 'CPF matematicamente válido: os dígitos verificadores conferem.',
  };
}

