export class Sanitize {
  /**
   * Sanitize description field.
   * @param {String} s The description.
   * @returns Normalized description field.
   */
  static description(s: string): string {
    return s.substring(0, 32);
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
}
