import { describe, it, expect } from 'vitest';
import { calcClientDiscount } from '../src/discount';

describe('calcClientDiscount', () => {
  it.each([-1, -0.5, 1.5, 2.7])(
    'відхиляє некоректний стаж %s',
    (years) => {
      expect(() => calcClientDiscount(years))
        .toThrow('INVALID_EXPERIENCE');
    },
  );
});
