import { Domain } from '@zro/common';

/**
 * Currency symbol position relative to amount.
 */
export enum CurrencySymbolAlign {
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * System control currency state. Not active currencies cannot be used on operations.
 */
export enum CurrencyState {
  ACTIVE = 'active',
  DEACTIVATE = 'deactivate',
}

/**
 * Currency type.
 */
export enum CurrencyType {
  FIAT = 'FIAT',
  CRYPTO = 'CRYPTO',
  FAN_TOKEN = 'FAN_TOKEN',
  DIGITAL_ASSET = 'DIGITAL_ASSET',
  UTILITY_TOKEN = 'UTILITY_TOKEN',
  DEFI = 'DEFI',
}

export interface Currency extends Domain<number> {
  /**
   * Currency title. Example: 'Real'
   */
  title: string;

  /**
   * Currency symbol. Example: 'R$'
   */
  symbol: string;

  /**
   * Symbol align. Example: 'right - 0.0001 BTC'
   */
  symbolAlign: CurrencySymbolAlign;

  /**
   * Unique currency constant identifier. Example: 'BTC'
   */
  tag: string;

  /**
   * Number of decimal places. Example: '8 - 0.00000001 BTC'
   */
  decimal: number;

  /**
   * System currency state control.
   */
  state: CurrencyState;

  /**
   * Currency type.
   */
  type: CurrencyType;

  /**
   * Check if currency is active.
   * @returns {boolean} True if currency is active or false otherwise.
   */
  isActive: () => boolean;
}

export class CurrencyEntity implements Currency {
  id?: number;
  title: string;
  symbol: string;
  symbolAlign: CurrencySymbolAlign;
  tag: string;
  decimal: number;
  state: CurrencyState;
  type: CurrencyType;

  constructor(props: Partial<Currency>) {
    Object.assign(this, props);
  }

  isActive(): boolean {
    return this.state === CurrencyState.ACTIVE;
  }
}
