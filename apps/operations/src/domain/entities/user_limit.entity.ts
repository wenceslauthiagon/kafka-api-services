import { validateHourTimeFormat, Domain, getMoment } from '@zro/common';
import { User } from '@zro/users/domain';
import { LimitType } from './limit_type.entity';

/**
 * Default limits for operations.
 */
export interface UserLimit extends Domain<string> {
  /**
   * Limit owner.
   */
  user: User;

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
   * Max credit balance offer for user.
   */
  creditBalance?: number;

  /**
   * Get nighttime interval by the base moment.
   * If the base moment time is after the nighttime start time, then the
   * nighttime interval starts on the same day as the base moment.
   * If the base moment time is before then the nighttime end time, then the
   * nighttime interval starts on the previous day.
   *
   * @param base Base moment.
   * @returns True if base is in this limit nighttime interval or false otherwise.
   */
  isInNighttimeInterval(base: moment.Moment): boolean;

  /**
   * Does this limit type have nightly limits?
   * @returns True if both start and end nighttime are not null and valid.
   */
  hasNighttime(): boolean;
}

export class UserLimitEntity implements UserLimit {
  id?: string;
  user: User;
  limitType: LimitType;
  nightlyLimit?: number;
  dailyLimit: number;
  monthlyLimit: number;
  yearlyLimit: number;
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

  constructor(props: Partial<UserLimit>) {
    Object.assign(this, props);
  }

  isInNighttimeInterval(base: moment.Moment): boolean {
    if (!this.hasNighttime()) return false;

    const TIME_FORMAT = 'HH:mm';
    const start = getMoment(this.nighttimeStart, TIME_FORMAT);
    const end = getMoment(this.nighttimeEnd, TIME_FORMAT);
    base = getMoment(base);

    if (start.isAfter(end)) {
      end.add(1, 'day');
    }

    if (base.isBefore(start)) {
      start.subtract(1, 'day');
      end.subtract(1, 'day');
    }

    return base.isBetween(start, end, undefined, '[)');
  }

  hasNighttime(): boolean {
    return (
      !!this.nighttimeStart &&
      !!this.nighttimeEnd &&
      validateHourTimeFormat(this.nighttimeStart) &&
      validateHourTimeFormat(this.nighttimeEnd)
    );
  }
}
