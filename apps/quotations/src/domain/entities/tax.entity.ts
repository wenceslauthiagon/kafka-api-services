import { Domain, formatTax, formatValueFromIntToFloat } from '@zro/common';

/**
 * The bps decimal value (ex: 1% = 100 bps)
 */
const BPS_DECIMAL = 4;

export interface Tax extends Domain<string> {
  name: string;
  value: number;
  valueFloat: number;
  format: string;
  formattedValue: string;
  createdAt?: Date;
}

export class TaxEntity implements Tax {
  id: string;
  name: string;
  value: number;
  format: string;
  createdAt?: Date;

  constructor(props: Partial<Tax>) {
    Object.assign(this, props);
  }

  get valueFloat(): number {
    return formatValueFromIntToFloat(this.value, BPS_DECIMAL);
  }

  get formattedValue(): string {
    return formatTax(this.value, this.format);
  }
}
