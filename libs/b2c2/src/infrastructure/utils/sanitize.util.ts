import { formatValueFromFloatToInt } from '@zro/common';

export class Sanitize {
  /**
   * Convert number from string to float.
   *
   * @param {Integer} value Value to be converted.
   * @returns {Float} Returns the converted value.
   */
  static toFloat(value: string): number {
    return value && parseFloat(value);
  }

  /**
   * Convert float from string to integer.
   *
   * @param {Float} value Value to be converted.
   * @returns {Integer} Returns the converted value.
   */
  // TODO: Improve this method to be careful about the precision of the value
  static toInt(value: string): number | string {
    return formatValueFromFloatToInt(value);
  }

  /**
   * Get market name from currencies.
   *
   * @param baseCurrency Base market currency.
   * @param quoteCurrency Quote market currency.
   * @returns Market name.
   */
  static toMarket(baseCurrency: string, quoteCurrency: string) {
    return `${baseCurrency}${quoteCurrency}.SPOT`;
  }
}
