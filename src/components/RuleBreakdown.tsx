import type { CpfResult } from '../lib/cpf';

interface RuleBreakdownProps {
  /** Resultado da analise, com os digitos verificadores. */
  readonly result: CpfResult;
}

/**
 * Detalhamento do calculo modulo 11 (SDD 14.1).
 *
 * Usa `<details>` nativo para ter semantica e navegacao por teclado
 * de graca, sem nenhum JavaScript adicional.
 */
export function RuleBreakdown({ result }: RuleBreakdownProps) {
  const { expected, found } = result;

  if (expected === null || found === null) {
    return null;
  }

  const dv1Matches = expected.dv1 === found.dv1;
  const dv2Matches = expected.dv2 === found.dv2;

  return (
    <details className="rule-breakdown" data-testid="rule-breakdown">
      <summary className="rule-breakdown__summary">Ver o cálculo dos dígitos verificadores</summary>
      <div className="rule-breakdown__body">
        <table className="calc-table" data-testid="calc-table">
          <caption>Primeiro dígito verificador (DV1)</caption>
          <thead>
            <tr>
              <th scope="col">Etapa</th>
              <th scope="col">Esperado</th>
              <th scope="col">Encontrado</th>
              <th scope="col">Situação</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>10º dígito</td>
              <td>{expected.dv1}</td>
              <td>{found.dv1}</td>
              <td
                className={dv1Matches ? 'calc-table__match' : 'calc-table__mismatch'}
                data-testid={dv1Matches ? 'verdict-match' : 'verdict-mismatch'}
              >
                {dv1Matches ? 'confere' : 'divergente'}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="calc-table" data-testid="calc-table">
          <caption>Segundo dígito verificador (DV2)</caption>
          <thead>
            <tr>
              <th scope="col">Etapa</th>
              <th scope="col">Esperado</th>
              <th scope="col">Encontrado</th>
              <th scope="col">Situação</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>11º dígito</td>
              <td>{expected.dv2}</td>
              <td>{found.dv2}</td>
              <td
                className={dv2Matches ? 'calc-table__match' : 'calc-table__mismatch'}
                data-testid={dv2Matches ? 'verdict-match' : 'verdict-mismatch'}
              >
                {dv2Matches ? 'confere' : 'divergente'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  );
}
