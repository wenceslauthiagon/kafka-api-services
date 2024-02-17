import { Holiday } from '@zro/quotations/domain';

export interface QuotationService {
  /**
   * Get holiday by date.
   * @param date Date.
   * @returns Holiday.
   */
  getHolidayByDate: (date: Date) => Promise<Holiday>;
}
