export interface DiscountOptions {
  birthday?: boolean;
}

const RATE_BASE = 0;

function assertValidExperience(years: number): void {
  if (years < 0) {
    throw new Error('INVALID_EXPERIENCE');
  }
}

export function calcClientDiscount(
  years: number,
  options: DiscountOptions = {},
): number {
  assertValidExperience(years);
  return RATE_BASE;
}
