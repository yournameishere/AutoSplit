const MAS_DECIMALS = 9n;
const MAS_FACTOR = 10n ** MAS_DECIMALS;

export function planckToMas(
  value: string | bigint | number,
): number {
  let big: bigint;
  if (typeof value === 'string') {
    big = BigInt(value);
  } else if (typeof value === 'number') {
    big = BigInt(Math.trunc(value));
  } else {
    big = value;
  }
  return Number(big) / Number(MAS_FACTOR);
}

export function formatMas(
  value: string | bigint | number,
  fractionDigits = 2,
): string {
  return planckToMas(value).toFixed(fractionDigits);
}

export function basisPointsToPercent(value: number): number {
  return value / 100;
}

export function formatTimestamp(ts: string | number): string {
  const milliseconds =
    typeof ts === 'string' ? Number(ts) : Number(ts);
  return new Date(milliseconds).toLocaleString();
}

export function shortAddress(address: string, size = 4): string {
  if (!address) return '';
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

