import { Domain } from '@zro/common';
import { LimitType } from './limit_type.entity';

/**
 * Default limits for operations.
 */
export interface GlobalLimit extends Domain<string> {
  /**
   * Limit type.
   */
  limitType: LimitType;

  /**
   * Max accumulated operations in one night.
   */
  nightlyLimit?: number;

  /**
   * Max accumulated operations in one day.
   */
  dailyLimit: number;

  /**
   * Max accumulated operations in one month.
   */
  monthlyLimit: number;

  /**
   * Max accumulated operations in one year.
   */
  yearlyLimit: number;

  /**
   * Max value of one operation.
   */
  maxAmount?: number;

  /**
   * Min value of one operation.
   */
  minAmount?: number;

  /**
   * Max value of one operation in nightly period.
   */
  maxAmountNightly?: number;

  /**
   * Min value of one operation in nightly period.
   */
  minAmountNightly?: number;

  /**
   * User defined max value of one operation.
   */
  userMaxAmount?: number;

  /**
   * User defined min value of one operation.
   */
  userMinAmount?: number;

  /**
   * User defined max value of one operation in nightly period.
   */
  userMaxAmountNightly?: number;

  /**
   * User defined min value of one operation in nightly period.
   */
  userMinAmountNightly?: number;

  /**
   * User defined max accumulated operations in one night.
   */
  userNightlyLimit?: number;

  /**
   * User defined max accumulated operations in one day.
   */
  userDailyLimit?: number;

  /**
   * User defined max accumulated operations in one month.
   */
  userMonthlyLimit?: number;

  /**
   * User defined max accumulated operations in one year.
   */
  userYearlyLimit?: number;

  /**
   * Start time of the day to apply this limit. All day will be considered if
   * this value is null or invalid. Valid format: 'HH:mm'
   */
  nighttimeStart?: string;

  /**
   * End time of the day to apply this limit. All day will be considered if
   * this value is null or invalid. Valid format: 'HH:mm'
   */
  nighttimeEnd?: string;

  /**
   * Max credit balance offer.
   */
  creditBalance?: number;
}

export class GlobalLimitEntity implements GlobalLimit {
  id?: string;
  limitType!: LimitType;
  nightlyLimit?: number;
  dailyLimit!: number;
  monthlyLimit!: number;
  yearlyLimit!: number;
  maxAmount?: number;
  minAmount?: number;
  maxAmountNightly?: number;
  minAmountNightly?: number;
  userMaxAmount?: number;
  userMinAmount?: number;
  userMaxAmountNightly?: number;
  userMinAmountNightly?: number;
  userNightlyLimit?: number;
  userDailyLimit?: number;
  userMonthlyLimit?: number;
  userYearlyLimit?: number;
  nighttimeStart?: string;
  nighttimeEnd?: string;
  creditBalance?: number = 0;

  constructor(props: Partial<GlobalLimit>) {
    Object.assign(this, props);
  }
}
