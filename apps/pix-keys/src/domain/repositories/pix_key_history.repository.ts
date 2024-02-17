import {
  PixKeyHistory,
  GetPixKeyHistoryFilter,
  GetPixKeyFilter,
} from '@zro/pix-keys/domain';
import { Pagination, TPaginationResponse } from '@zro/common';

export interface PixKeyHistoryRepository {
  /**
   * Insert a History for pix key.
   * @param {PixKeyHistory} pixKeyHistory PixKeyHistory to save.
   * @returns {PixKeyHistory} Created history.
   */
  create: (pixKeyHistory: PixKeyHistory) => Promise<PixKeyHistory>;

  /**
   * List all PixKeyHistory.
   * @return {PixKeyHistory} History found.
   */
  getByFilter: (
    pagination: Pagination,
    filter: GetPixKeyHistoryFilter,
    filterPixKey: GetPixKeyFilter,
  ) => Promise<TPaginationResponse<PixKeyHistory>>;
}
