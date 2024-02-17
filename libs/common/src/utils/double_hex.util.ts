const dhexDigits = '0123456789abcdefghijklmnopqrstuv';

export function intToDhex(value: number | string): string {
  let valueBig = BigInt(value);
  const dhex: string[] = [];
  while (valueBig > 0n) {
    dhex.unshift(dhexDigits.charAt(Number(valueBig % 32n)));
    valueBig >>= 5n;
  }
  return dhex.join('');
}

export function dhexToInt(dhex: string): bigint {
  let value = BigInt(0);
  for (let i = 0; i < dhex.length; i++) {
    value <<= 5n;
    const z = dhex.charCodeAt(i);
    value |= BigInt(z - (z < 'a'.charCodeAt(0) ? 48 : 87));
  }
  return value;
}
