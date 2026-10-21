import { describe, expect, it } from 'vitest';

import { buildPaperTransform, buildStampTransform } from '../App';
import { createStampArt } from '../lib/stamp';
import { createSeededRandom } from '../lib/motion';

describe('buildPaperTransform', () => {
  it('inclina o papel no maximo 2.2 graus em Y', () => {
    expect(buildPaperTransform(1, 0)).toContain('rotateY(2.200deg)');
    expect(buildPaperTransform(-1, 0)).toContain('rotateY(-2.200deg)');
  });

  it('inclina o papel no maximo 1.6 graus em X', () => {
    expect(buildPaperTransform(0, 1)).toContain('rotateX(-1.600deg)');
    expect(buildPaperTransform(0, -1)).toContain('rotateX(1.600deg)');
  });

  it('mantem translateZ para forcar rasterizacao em camada unica', () => {
    expect(buildPaperTransform(0.5, 0.5)).toContain('translateZ(0)');
  });
});

describe('buildStampTransform', () => {
  it('desloca o carimbo no maximo 10px em X e 7px em Y', () => {
    expect(buildStampTransform(1, 1)).toBe('translate(10.00px, 7.00px)');
    expect(buildStampTransform(-1, -1)).toBe('translate(-10.00px, -7.00px)');
  });

  it('nao desloca o carimbo na posicao central do ponteiro', () => {
    expect(buildStampTransform(0, 0)).toBe('translate(0.00px, 0.00px)');
  });
});

describe('createSeededRandom', () => {
  it('produz a mesma sequencia para a mesma semente', () => {
    const first = createSeededRandom(42);
    const second = createSeededRandom(42);

    expect(first()).toBe(second());
    expect(first()).toBe(second());
  });

  it('produz sequencias diferentes para sementes diferentes', () => {
    expect(createSeededRandom(1)()).not.toBe(createSeededRandom(2)());
  });

  it('gera valores dentro de [0, 1)', () => {
    const random = createSeededRandom(7);

    for (let index = 0; index < 200; index += 1) {
      const value = random();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('createStampArt', () => {
  it('e reproduzivel para a mesma semente', () => {
    expect(createStampArt(20260101)).toEqual(createStampArt(20260101));
  });

  it('mantem a inclinacao entre -9 e -4 graus', () => {
    for (const seed of [1, 2, 3, 99, 20260101]) {
      const art = createStampArt(seed);

      expect(art.tilt).toBeGreaterThanOrEqual(-9);
      expect(art.tilt).toBeLessThanOrEqual(-4);
    }
  });

  it('produz uma assinatura SVG valida', () => {
    const art = createStampArt(20260101);

    expect(art.signature).toMatch(/^M [\d.]+ [\d.]+ C /);
  });
});
