import { WarningPixBlockList } from '@zro/pix-payments/domain';

export interface WarningPixBlockListRepository {
  /**
   * Insert a WarningPixBlockList.
   * @param warningPixBlockList warningPixBlockList to save.
   * @returns Created warningPixBlockList.
   */
  create: (
    warningPixBlockList: WarningPixBlockList,
  ) => Promise<WarningPixBlockList>;

  /**
   * Update warningPixBlockList.
   * @param warningPixBlockList warningPixBlockList to update.
   * @returns Updated warningPixBlockList.
   */
  update: (
    warningPixBlockList: WarningPixBlockList,
  ) => Promise<WarningPixBlockList>;

  /**
   * get all blocked CPFs.
   * @returns All blocked CPFs.
   */
  getAllCpf: () => Promise<Array<string>>;
}
