import { describe, it, expect } from 'vitest';
import {
  calcSubtotal,
  calcDiscountRate,
  calcShipping,
  calcOrderTotal,
  type OrderItem,
} from '../src/order';
 
const item = (price: number, qty = 1): OrderItem => ({
  sku: 'SKU-1',
  price,
  qty,
});
 
describe('calcSubtotal', () => {
 
  it('підсумовує вартість позицій з урахуванням кількості', () => {
    // Arrange
    const items = [item(100, 2), { sku: 'SKU-2', price: 50, qty: 3 }];
 
    // Act
    const result = calcSubtotal(items);
 
    // Assert
    expect(result).toBe(350);
  });
 
  it('відхиляє порожнє замовлення', () => {
    expect(() => calcSubtotal([])).toThrow('EMPTY_ORDER');
  });
 
  it('відхиляє від’ємну ціну', () => {
    expect(() => calcSubtotal([item(-1)])).toThrow('NEGATIVE_PRICE');
  });
 
  it.each([0, -1, 1.5])('відхиляє кількість %s', (qty) => {
    expect(() => calcSubtotal([item(100, qty)])).toThrow('INVALID_QTY');
  });
});

describe('calcDiscountRate', () => {
 
  it.each([
    { tier: 'basic' as const,  subtotal: 500,  expected: 0 },
    { tier: 'silver' as const, subtotal: 500,  expected: 0.05 },
    { tier: 'gold' as const,   subtotal: 500,  expected: 0.1 },
    { tier: 'basic' as const,  subtotal: 2000, expected: 0.05 },
    { tier: 'gold' as const,   subtotal: 2000, expected: 0.15 },
  ])(
    'рівень $tier із сумою $subtotal дає ставку $expected',
    ({ tier, subtotal, expected }) => {
      expect(calcDiscountRate(tier, subtotal)).toBeCloseTo(expected, 4);
    },
  );
 
  it.each([
    { subtotal: 1999, expected: 0 },
    { subtotal: 2000, expected: 0.05 },
    { subtotal: 2001, expected: 0.05 },
  ])('межа великого замовлення: $subtotal', ({ subtotal, expected }) => {
    expect(calcDiscountRate('basic', subtotal)).toBeCloseTo(expected, 4);
  });
 
  it('обмежує сумарну знижку максимальним значенням', () => {
    expect(calcDiscountRate('gold', 2000, 0.5)).toBe(0.25);
  });
 
  it('відхиляє від’ємний промокод', () => {
    expect(() => calcDiscountRate('basic', 500, -0.1))
      .toThrow('INVALID_PROMO');
  });
});

describe('calcShipping', () => {
  it.each([
    [999, 60],
    [1000, 0],
    [1001, 0],
  ])('сума %i → доставка %i', (amount, expected) => {
    expect(calcShipping(amount)).toBe(expected);
  });
});
 
describe('calcOrderTotal', () => {
 
  it('додає доставку до замовлення нижче порога', () => {
    const total = calcOrderTotal([item(500)], 'basic');
    expect(total).toBeCloseTo(560, 2);
  });
 
  it('не додає доставку, якщо сума після знижки сягає порога', () => {
    // 1200 − 10 % = 1080 ≥ 1000, доставка безкоштовна
    const total = calcOrderTotal([item(1200)], 'gold');
    expect(total).toBeCloseTo(1080, 2);
  });
 
  it('знижка може опустити суму нижче порога доставки', () => {
    // 1050 − 10 % = 945 < 1000, тому доставка платна
    const total = calcOrderTotal([item(1050)], 'gold');
    expect(total).toBeCloseTo(1005, 2);
  });
 
  it('передає виняток із нижнього рівня', () => {
    expect(() => calcOrderTotal([], 'gold')).toThrow('EMPTY_ORDER');
  });
});

//
// ==================================
//

import {
  splitPayment,
  INVALID_PARTS,
  NEGATIVE_TOTAL,
} from '../src/order';

describe('splitPayment', () => {

  // Коректний поділ без залишку
  it('ділить суму без залишку на рівні частини', () => {
    expect(splitPayment(100, 4)).toEqual([25, 25, 25, 25]);
  });

  // Коректний поділ із залишком
  it('розподіляє залишок у 1 копійку на перші частини', () => {
    // 100.00 / 3 → 33.34 + 33.33 + 33.33
    expect(splitPayment(100, 3)).toEqual([33.34, 33.33, 33.33]);
  });

  it('розподіляє залишок у 2 копійки на перші дві частини', () => {
    // 10.00 / 7 -> 1.43 + 1.43 + 1.43*5 ... (10.00 = 1000 центів)
    // 1000 / 7 = 142 (база), залишок 6 -> перші 6 частин по 1.43, остання 1.42
    const parts = splitPayment(10, 7);
    expect(parts).toEqual([1.43, 1.43, 1.43, 1.43, 1.43, 1.43, 1.42]);
  });

  // Сума частин точно дорівнює total
  it('сума частин точно дорівнює початковій сумі', () => {
    const total = 99.99;
    const parts = splitPayment(total, 7);
    const sumCents = parts.reduce((s, p) => s + Math.round(p * 100), 0);
    expect(sumCents).toBe(Math.round(total * 100));
  });

  it('сума частин точно дорівнює total для 100.01 на 3', () => {
    const parts = splitPayment(100.01, 3);
    const sumCents = parts.reduce((s, p) => s + Math.round(p * 100), 0);
    expect(sumCents).toBe(10001);
    expect(parts).toEqual([33.34, 33.34, 33.33]);
  });

  // Параметризований тест: межові значення parts
  it.each([
    { parts: 1, total: 100, expected: [100] },        // межа
    { parts: 2, total: 100, expected: [50, 50] },     // межа + 1
    { parts: 4, total: 1, expected: [0.25, 0.25, 0.25, 0.25] },
    { parts: 3, total: 0, expected: [0, 0, 0] },      // сума 0
  ])(
    'total=$total, parts=$parts → $expected',
    ({ total, parts, expected }) => {
      expect(splitPayment(total, parts)).toEqual(expected);
    },
  );

  // Межа parts: 0, 1, 2 (правило мінус один / межа / плюс один)
  it.each([
    { parts: 0, throws: INVALID_PARTS },
    { parts: 1, throws: null },
    { parts: 2, throws: null },
  ])(
    'parts=$parts -> throws=$throws',
    ({ parts, throws }) => {
      if (throws) {
        expect(() => splitPayment(100, parts)).toThrow(throws);
      } else {
        expect(() => splitPayment(100, parts)).not.toThrow();
      }
    },
  );

  // Некоректні дані: parts
  it.each([
    { parts: 0, reason: 'нуль частин' },
    { parts: -1, reason: 'від’ємна кількість частин' },
    { parts: 1.5, reason: 'дробова кількість частин' },
  ])('відхиляє $reason (parts=$parts)', ({ parts }) => {
    expect(() => splitPayment(100, parts)).toThrow(INVALID_PARTS);
  });

  // Некоректні дані: total
  it('відхиляє від’ємну суму', () => {
    expect(() => splitPayment(-0.01, 2)).toThrow(NEGATIVE_TOTAL);
  });

  // Межове значення total: -0.01 / 0 / 0.01
  it.each([
    { total: -0.01, throws: NEGATIVE_TOTAL },
    { total: 0, throws: null },
    { total: 0.01, throws: null },
  ])(
    'total=$total -> throws=$throws',
    ({ total, throws }) => {
      if (throws) {
        expect(() => splitPayment(total, 2)).toThrow(throws);
      } else {
        expect(() => splitPayment(total, 2)).not.toThrow();
      }
    },
  );

  // Округлення рухомої коми
  it('коректно працює з сумами, що мають похибку рухомої коми', () => {
    // 0.1 + 0.2 = 0.30000000000000004 -> Math.round дає 30 центів
    expect(splitPayment(0.1 + 0.2, 3)).toEqual([0.1, 0.1, 0.1]);
  });
});
