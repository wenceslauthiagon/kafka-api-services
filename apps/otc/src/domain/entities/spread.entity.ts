import {
  Domain,
  formatValueFromIntToFloat,
  validateHourTimeFormat,
  getMoment,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency } from '@zro/operations/domain';

/**
 * The bps decimal value (ex: 1% = 100 bps)
 */
const BPS_DECIMAL = 4;

export interface Spread extends Domain<string> {
  currency: Currency;
  user?: User;
  buy: number;
  sell: number;
  buyFloat: number;
  sellFloat: number;
  amount: number;
  offMarketBuy?: number;
  offMarketSell?: number;
  offMarketBuyFloat?: number;
  offMarketSellFloat?: number;
  offMarketTimeStart?: string;
  offMarketTimeEnd?: string;
  createdAt: Date;
  isInOffMarketInterval(base: moment.Moment): boolean;
  hasOffMarketInterval(): boolean;
}

export class SpreadEntity implements Spread {
  id: string;
  user?: User;
  currency: Currency;
  buy: number;
  sell: number;
  amount: number;
  offMarketBuy?: number;
  offMarketSell?: number;
  offMarketTimeStart?: string;
  offMarketTimeEnd?: string;
  createdAt: Date;

  constructor(props: Partial<Spread>) {
    Object.assign(this, props);
  }

  get buyFloat(): number {
    return formatValueFromIntToFloat(this.buy, BPS_DECIMAL);
  }

  get sellFloat(): number {
    return formatValueFromIntToFloat(this.sell, BPS_DECIMAL);
  }

  get offMarketBuyFloat(): number {
    return (
      this.offMarketBuy &&
      formatValueFromIntToFloat(this.offMarketBuy, BPS_DECIMAL)
    );
  }

  get offMarketSellFloat(): number {
    return (
      this.offMarketSell &&
      formatValueFromIntToFloat(this.offMarketSell, BPS_DECIMAL)
    );
  }

  isInOffMarketInterval(base: moment.Moment): boolean {
    // Check if today is weekend - Sunday (day 0) or Saturday (day 6).
    const isWeekend = [0, 6].includes(base.day());
    if (isWeekend) return true;

    if (!this.hasOffMarketInterval()) return false;

    // Check if time is between start and end time.
    const TIME_FORMAT = 'HH:mm';
    const start = getMoment(this.offMarketTimeStart, TIME_FORMAT);
    const end = getMoment(this.offMarketTimeEnd, TIME_FORMAT);

    if (start.isAfter(end)) {
      end.add(1, 'day');
    }

    if (base.isBefore(start)) {
      start.subtract(1, 'day');
      end.subtract(1, 'day');
    }

    return base.isBetween(start, end);
  }

  hasOffMarketInterval(): boolean {
    return (
      !!this.offMarketTimeStart &&
      !!this.offMarketTimeEnd &&
      validateHourTimeFormat(this.offMarketTimeStart) &&
      validateHourTimeFormat(this.offMarketTimeEnd)
    );
  }
}
