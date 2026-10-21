import { describe, expect, it } from 'vitest';

import {
  CPF_BASE_LENGTH,
  CPF_LENGTH,
  FIRST_CHECK_WEIGHTS,
  SECOND_CHECK_WEIGHTS,
  formatCpf,
  isSequential,
  onlyDigits,
  validateCpf,
} from '../lib/cpf';

describe('onlyDigits', () => {
  it('remove todos os caracteres nao numericos', () => {
    expect(onlyDigits('529.982.247-25')).toBe('52998224725');
  });

  it('preserva zeros a esquerda', () => {
    expect(onlyDigits('000.000.000-00')).toBe('00000000000');
  });

  it('devolve cadeia vazia para entrada sem digitos', () => {
    expect(onlyDigits('abc')).toBe('');
  });

  it('limita a onze digitos', () => {
    expect(onlyDigits('52998224725000')).toHaveLength(CPF_LENGTH);
  });
});

describe('formatCpf', () => {
  it('aplica a mascara oficial em numero completo', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
  });

  it('aplica pontuacao progressiva em numeros parciais', () => {
    expect(formatCpf('529')).toBe('529');
    expect(formatCpf('5299')).toBe('529.9');
    expect(formatCpf('529982')).toBe('529.982');
    expect(formatCpf('5299822')).toBe('529.982.2');
    expect(formatCpf('52998224')).toBe('529.982.24');
    expect(formatCpf('529982247')).toBe('529.982.247');
    expect(formatCpf('5299822472')).toBe('529.982.247-2');
  });

  it('trunca entradas com mais de onze digitos', () => {
    expect(formatCpf('52998224725000')).toBe('529.982.247-25');
  });
});

describe('isSequential', () => {
  it('reconhece base homogenea', () => {
    expect(isSequential('111111111')).toBe(true);
    expect(isSequential('000000000')).toBe(true);
  });

  it('reconhece progressao aritmetica de razao um', () => {
    expect(isSequential('123456789')).toBe(true);
    expect(isSequential('987654321')).toBe(true);
    expect(isSequential('012345678')).toBe(true);
    expect(isSequential('234567890')).toBe(true);
  });

  it('nao marca bases comuns', () => {
    expect(isSequential('529982247')).toBe(false);
  });
});

describe('validateCpf', () => {
  it('classifica como valido um CPF com digitos verificadores corretos', () => {
    const result = validateCpf('529.982.247-25');

    expect(result.status).toBe('VALID');
    expect(result.isValid).toBe(true);
    expect(result.digits).toBe('52998224725');
    expect(result.formatted).toBe('529.982.247-25');
    expect(result.expected).toEqual({ dv1: 2, dv2: 5 });
    expect(result.found).toEqual({ dv1: 2, dv2: 5 });
    expect(result.reason).toBe('Os dígitos verificadores conferem.');
  });

  it('aceita o CPF canonico 111.444.777-35', () => {
    const result = validateCpf('111.444.777-35');

    expect(result.status).toBe('VALID');
    expect(result.expected).toEqual({ dv1: 3, dv2: 5 });
  });

  it('rejeita um CPF com primeiro digito verificador incorreto', () => {
    const result = validateCpf('529.982.247-35');

    expect(result.status).toBe('INVALID_DV1');
    expect(result.isValid).toBe(false);
    expect(result.expected?.dv1).toBe(2);
    expect(result.found?.dv1).toBe(3);
  });

  it('rejeita um CPF com segundo digito verificador incorreto', () => {
    const result = validateCpf('529.982.247-26');

    expect(result.status).toBe('INVALID_DV2');
    expect(result.expected?.dv2).toBe(5);
    expect(result.found?.dv2).toBe(6);
  });

  it('rejeita entrada vazia', () => {
    const result = validateCpf('');

    expect(result.status).toBe('EMPTY');
    expect(result.expected).toBeNull();
    expect(result.found).toBeNull();
  });

  it('rejeita entrada apenas com espacos', () => {
    expect(validateCpf('   ').status).toBe('EMPTY');
  });

  it('rejeita entrada com caracteres nao numericos', () => {
    const result = validateCpf('529.982.247-2a');

    expect(result.status).toBe('INVALID_CHARS');
    expect(result.reason).toBe('O CPF deve conter apenas números.');
  });

  it('rejeita numero incompleto informando quantos digitos faltam', () => {
    const result = validateCpf('529.982.247');

    expect(result.status).toBe('INCOMPLETE');
    expect(result.reason).toBe('Faltam 2 dígitos.');
  });

  it('rejeita numero excedente informando quantos digitos foram digitados', () => {
    const result = validateCpf('529.982.247-251');

    expect(result.status).toBe('INVALID_LENGTH');
    expect(result.reason).toBe('O CPF tem 11 dígitos; você digitou 12.');
  });

  it('classifica como sequencial um CPF cujos digitos conferem', () => {
    const result = validateCpf('123.456.789-09');

    expect(result.status).toBe('SEQUENTIAL');
    expect(result.isValid).toBe(false);
    expect(result.expected).toEqual({ dv1: 0, dv2: 9 });
  });

  it('classifica como sequencial um CPF de digitos repetidos', () => {
    const result = validateCpf('111.111.111-11');

    expect(result.status).toBe('SEQUENTIAL');
  });

  it('prioriza o erro de DV sobre a classificacao sequencial', () => {
    const result = validateCpf('123.456.789-08');

    expect(result.status).toBe('INVALID_DV2');
  });

  it('aceita numero sem formatacao', () => {
    expect(validateCpf('52998224725').status).toBe('VALID');
  });

  it('aceita numero com espacos de separacao', () => {
    expect(validateCpf('529 982 247 25').status).toBe('VALID');
  });

  it('e pura: duas chamadas com a mesma entrada produzem o mesmo resultado', () => {
    expect(validateCpf('529.982.247-25')).toEqual(validateCpf('529.982.247-25'));
  });

  it('utiliza os pesos oficiais em ambas as etapas', () => {
    expect(FIRST_CHECK_WEIGHTS).toHaveLength(CPF_BASE_LENGTH);
    expect(SECOND_CHECK_WEIGHTS).toHaveLength(CPF_LENGTH - 1);
    expect(FIRST_CHECK_WEIGHTS[0]).toBe(10);
    expect(SECOND_CHECK_WEIGHTS[0]).toBe(11);
  });
});
