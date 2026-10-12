import { describe, it, expect } from 'vitest';
import { isLeapYear } from '../src/leapYear';

describe('isLeapYear', () => {
  it('повертає true для високосного року', () => {
    expect(isLeapYear(2024)).toBe(true);
  });

  it('повертає false для звичайного року', () => {
    expect(isLeapYear(2023)).toBe(false);
  });

  it('повертає true для року, який ділиться на 400', () => {
    expect(isLeapYear(2000)).toBe(true);
  });

  it('повертає false для року, який ділиться на 100, але не на 400', () => {
    expect(isLeapYear(1900)).toBe(false);
  });

  it('відхиляє від’ємний рік', () => {
    expect(() => isLeapYear(-4)).toThrow('INVALID_YEAR');
  });

  it('відхиляє нецілий рік', () => {
    expect(() => isLeapYear(2024.5)).toThrow('INVALID_YEAR');
  });
});
