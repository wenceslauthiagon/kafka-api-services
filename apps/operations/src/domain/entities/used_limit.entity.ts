export interface UsedLimit {
  /**
   * Used overnight limit.
   */
  nightlyLimit?: number;

  /**
   * Used daily limit.
   */
  dailyLimit: number;

  /**
   * Used monthly limit.
   */
  monthlyLimit: number;

  /**
   * Used yearly limit.
   */
  yearlyLimit: number;
}
