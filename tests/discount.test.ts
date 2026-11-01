import { describe, it, expect } from 'vitest';
import { calcClientDiscount } from '../src/discount';

describe('calcClientDiscount', () => {
  it.each([-1, -0.5, -100])(
    'відхиляє від’ємний стаж %s',
    (years) => {
      expect(() => calcClientDiscount(years))
        .toThrow('INVALID_EXPERIENCE');
    },
  );
});

it.each([
  { years: 0,   expected: 0 },
  { years: 0.5, expected: 0 },
  { years: 1,   expected: 0 },
])('стаж $years років → знижка $expected', ({ years, expected }) => {
  expect(calcClientDiscount(years)).toBe(expected);
});

