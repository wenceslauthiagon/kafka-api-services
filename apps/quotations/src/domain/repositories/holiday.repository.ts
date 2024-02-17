import { Pagination, TPaginationResponse } from '@zro/common';
import { Holiday, HolidayLevel } from '@zro/quotations/domain';

export interface HolidayRepository {
  /**
   * Insert a Holiday.
   * @param holiday Holiday to save.
   * @returns Created holiday.
   */
  create: (holiday: Holiday) => Promise<Holiday>;

  /**
   * Update a Holiday.
   * @param holiday Holiday to update.
   * @returns Updated holiday.
   */
  update: (holiday: Holiday) => Promise<Holiday>;

  /**
   * Search by Holiday ID.
   * @param id Holiday ID.
   * @return Holiday found.
   */
  getById: (id: string) => Promise<Holiday>;

  /**
   * Search by Holiday's date.
   * @param date Holiday date.
   * @param level Holiday level.
   * @return Holiday found.
   */
  getByDate: (date: Date, level?: HolidayLevel) => Promise<Holiday>;

  /**
   * List all Holiday.
   * @return Holidays found.
   */
  getAll: (pagination: Pagination) => Promise<TPaginationResponse<Holiday>>;

  /**
   * Search by Holiday's date.
   * @param date Holiday date.
   * @param levels Holiday level.
   * @return Holiday found.
   */
  getByDateAndLevels: (date: Date, levels: HolidayLevel[]) => Promise<Holiday>;
}
