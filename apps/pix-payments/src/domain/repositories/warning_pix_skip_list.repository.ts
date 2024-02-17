import { WarningPixSkipList } from '@zro/pix-payments/domain';

export interface WarningPixSkipListRepository {
  /**
   * Insert a WarningPixSkipList.
   * @param warningPixSkipList warningPixSkipList to save.
   * @returns Created warningPixSkipList.
   */
  create: (
    warningPixSkipList: WarningPixSkipList,
  ) => Promise<WarningPixSkipList>;

  /**
   * Update warningPixSkipList.
   * @param warningPixSkipList warningPixSkipList to update.
   * @returns Updated warningPixSkipList.
   */
  update: (
    warningPixSkipList: WarningPixSkipList,
  ) => Promise<WarningPixSkipList>;

  /**
   * get a warningPixSkipList by id.
   * @param {String} id warningPixSkipList id to get.
   * @returns Get warningPixSkipList.
   */
  getByClientAccountNumber: (
    clientAccountNumber: string,
  ) => Promise<WarningPixSkipList>;
}
