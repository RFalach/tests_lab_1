export interface DiscountOptions {
  birthday?: boolean;
}

export function calcClientDiscount(
  years: number,
  options: DiscountOptions = {},
): number {
  if (years < 0) {
    throw new Error('INVALID_EXPERIENCE');
  }
  return 0;
}
