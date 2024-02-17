export class Sanitize {
  /**
   * Sanitize description field.
   * @param {String} s The description.
   * @returns Normalized description field.
   */
  static description(s: string): string {
    return s.substring(0, 32);
  }
}
