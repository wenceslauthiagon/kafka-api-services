export class Sanitize {
  /**
   * Remove strings accentuation
   *
   * @param {String} value Value to be converted.
   * @returns {String} Returns the converted value.
   */
  static removeAccentuation(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ');
  }

  /**
   * Removes string '.' and '-' (for example phone numbers and zipcodes)
   *
   * @param {String} value Value to be converted.
   * @returns {String} Returns the converted value.
   */
  static removeSpecialCharacters(value: string): string {
    return value.replace(/[.-]/g, '');
  }

  /**
   * Slice strings
   *
   * @param {String} value Value to be sliced.
   * @param {Number} begin Begin of the slice.
   * @param {Number} end End of the slice.
   * @returns {String} Returns the sliced value.
   */
  static sliceSting(value: string, begin: number, end: number): string {
    return value.slice(begin, end);
  }
}
