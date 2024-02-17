import { formatValueFromFloatToInt } from '@zro/common';
import { formatValue } from './format_value.util';

export class Sanitize {
  /**
   * Sanitize name field.
   * @param {String} s The name.
   * @returns Normalized name field.
   */
  static fullName(s: string): string {
    return s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9 ]/g, '') // Remove non alpha-numeric
      .substring(0, 80);
  }

  /**
   * Sanitize email field.
   * @param {String} s The email.
   * @returns Normalized email field.
   */
  static email(s: string): string {
    return s.toLowerCase();
  }

  /**
   * Sanitize phone field.
   * @param {String} s The phone.
   * @returns Normalized phone field.
   */
  static phone(s: string): string {
    return '+' + s.replace(/[^0-9]/g, ''); // Remove non digits
  }

  /**
   * Sanitize document field.
   * @param {String} s The document.
   * @returns Normalized document field.
   */
  static document(s: string): string {
    return s.replace(/[^0-9]/g, ''); // Remove non digits
  }

  /**
   * Sanitize branch number field.
   * @param {String} s The branch number.
   * @returns Normalized branch number field.
   */
  static branch(s: string): string {
    return s
      .replace(/[^0-9]/g, '')
      .padStart(4, '0')
      .substring(0, 4); // Remove non digits
  }

  /**
   * Sanitize account number field.
   * @param {String} s The account number.
   * @returns Normalized account number field.
   */
  static accountNumber(s: string): string {
    return s.replace(/[^0-9]/g, ''); // Remove non digits
  }

  /**
   * Sanitize ISPB field.
   * @param {String} s The ISPB.
   * @returns Normalized ISPB field.
   */
  static ispb(s: string): string {
    return s.replace(/[^0-9]/g, ''); // Remove non digits
  }

  /**
   * Sanitize description field.
   * @param {String} s The description.
   * @returns Normalized description field.
   */
  static description(s: string): string {
    return s.substring(0, 80);
  }

  /**
   * Convert integer (R$ cents) to float (R$ units).
   *
   * @param {Integer} v Value to be converted.
   * @returns {Float} Returns the converted value.
   */
  static toValue(v: number): number {
    return formatValue(v);
  }

  /**
   * Convert float (R$ units) to integer (R$ cents).
   *
   * @param {Float} v Value to be converted.
   * @returns {Integer} Returns the converted value.
   */
  static toInt(v: number): number {
    return formatValueFromFloatToInt(v);
  }
}
