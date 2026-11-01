export interface DiscountOptions {
  birthday?: boolean;
}

const RATE_BASE = 0;
const RATE_JUNIOR = 0.05;
const RATE_MID = 0.10;
const RATE_SENIOR = 0.15;

const MIN_YEARS = 1;
const MID_YEARS = 3;
const SENIOR_YEARS = 5;

const BIRTHDAY_MULTIPLIER = 2;

function assertValidExperience(years: number): void {
  if (years < 0) {
    throw new Error('INVALID_EXPERIENCE');
  }
}

function getRate(years: number): number {
  if (years < MIN_YEARS) return RATE_BASE;
  if (years <= MID_YEARS) return RATE_JUNIOR;
  if (years <= SENIOR_YEARS) return RATE_MID;
  return RATE_SENIOR;
}

export function calcClientDiscount(
  years: number,
  options: DiscountOptions = {},
): number {
  assertValidExperience(years);
  let rate = getRate(years);
  if (options.birthday) rate *= BIRTHDAY_MULTIPLIER;
  return rate;
}

