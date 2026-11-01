export interface DiscountOptions {
  birthday?: boolean;
}

export function calcClientDiscount(
  years: number,
  options: DiscountOptions = {},
): number {
  throw new Error('INVALID_EXPERIENCE');
}
