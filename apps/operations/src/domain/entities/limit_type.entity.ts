import { Domain } from '@zro/common';
import { Currency, TransactionType } from '@zro/operations/domain';

/**
 * The period in which the limit must restart the accumulation of operations.
 */
export enum LimitTypePeriodStart {
  /**
   * The period begins at the start of the year, month, or day.
   */
  DATE = 'DATE',
  /**
   * The period begins now minus 365 days (year), 30 days (month), or 24 hours (day) ago.
   */
  INTERVAL = 'INTERVAL',
}

/**
 * The limit applies to the owner, beneficiary, or both.
 */
export enum LimitTypeCheck {
  /**
   * Should check owner operations only.
   */
  OWNER = 'OWNER',

  /**
   * Should check beneficiary operations only.
   */
  BENEFICIARY = 'BENEFICIARY',

  /**
   * Should check both operations.
   */
  BOTH = 'BOTH',
}

/**
 * Limits how much money a user can spend on operations in a period of time.
 */
export interface LimitType extends Domain<number> {
  /**
   * Unique constat type identifier. Example: 'CONVERSION'.
   */
  tag: string;

  /**
   * Description of limit type. Example: 'Pagamento de Boleto'.
   */
  description?: string;

  /**
   * Currency to apply this limit.
   */
  currency?: Currency;

  /**
   * Operation types to apply this limit.
   */
  transactionTypes: TransactionType[];

  /**
   * Limit period start.
   */
  periodStart: LimitTypePeriodStart;

  /**
   * Operation participants to apply this limit.
   */
  check: LimitTypeCheck;
}

export class LimitTypeEntity implements LimitType {
  id?: number;
  tag: string;
  description?: string;
  currency?: Currency;
  transactionTypes: TransactionType[];
  periodStart: LimitTypePeriodStart;
  check: LimitTypeCheck;

  constructor(props: Partial<LimitType>) {
    Object.assign(this, props);
  }
}
