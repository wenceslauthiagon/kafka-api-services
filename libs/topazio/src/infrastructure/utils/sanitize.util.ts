import { PaymentStatusType } from '@zro/api-topazio/domain';
import { getMoment } from '@zro/common';
import { TopazioPaymentStatus } from '@zro/topazio/domain';
import { TopazioPaymentStatusException } from '../exceptions/topazio_payment_status.exception';

export class Sanitize {
  /**
   * Sanitize name field with upper case and trim.
   * @param {String} s The name.
   * @returns Normalized name field.
   */
  static fullName(s: string): string {
    return s
      .trim()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9 ]/g, '') // Remove non alpha-numeric
      .toUpperCase()
      .substring(0, 80);
  }

  /**
   * Sanitize exception message field.
   * @param {String} s The message.
   * @returns Normalized name field.
   */
  static exceptionMessage(s: string): string {
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
    return `+${s.replace(/[^0-9]/g, '')}`; // Remove non digits
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
   * Sanitize bankCode number field.
   * @param {String} s The bankCode number.
   * @returns Normalized bankCode number field.
   */
  static bankCode(s: string): string {
    return s
      .replace(/[^0-9]/g, '')
      .padStart(3, '0')
      .substring(0, 3); // Remove non digits
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
    return parseFloat((v / 100.0).toFixed(2));
  }

  /**
   * Convert float (R$ units) to integer (R$ cents).
   *
   * @param {Float} value Value to be converted.
   * @returns {Integer} Returns the converted value.
   */
  static toInt(value: number, decimals = 2): number {
    return parseInt(
      Math.floor(
        0.5 + parseFloat(value.toString()) * 10 ** decimals,
      ).toString(),
    );
  }

  /**
   * Convert string date to object Date.
   *
   * @param date Date to be converted.
   * @returns Returns the converted date.
   */
  static toDate(date: string): Date {
    return date && getMoment(date).toDate();
  }

  /**
   * Convert date to format 'YYYY-MM-DD'.
   *
   * @param date Date to be converted to day.
   * @returns Returns the formatted date.
   */
  static formatToYearMonthDay(date: Date): string {
    return date && getMoment(date).format('YYYY-MM-DD');
  }

  /**
   * Convert date to format 'YYYY-MM-DD' with D+1.
   *
   * @param date Date to be converted to day.
   * @returns Returns the formatted date D+1.
   */
  static formatToYearMonthDayDPlusOne(date: Date): string {
    return date && getMoment(date).add(1, 'day').format('YYYY-MM-DD');
  }

  /**
   * Convert enum TopazioPaymentStatus to PaymentStatusType.
   *
   * @param status The source status from TopazioPaymentStatus enum.
   * @returns Returns the corresponding PaymentStatusType.
   */
  static parsePaymentStatusType(
    status: TopazioPaymentStatus,
  ): PaymentStatusType {
    switch (status) {
      case TopazioPaymentStatus.LIQUIDADO:
        return PaymentStatusType.SETTLED;
      case TopazioPaymentStatus.EM_PROCESSAMENTO:
        return PaymentStatusType.PROCESSING;
      case TopazioPaymentStatus.CHARGEBACK:
        return PaymentStatusType.CHARGEBACK;

      default:
        throw new TopazioPaymentStatusException(status);
    }
  }
}
