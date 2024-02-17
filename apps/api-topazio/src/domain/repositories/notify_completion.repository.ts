import { NotifyCompletion } from '@zro/api-topazio/domain';

export interface NotifyCompletionRepository {
  /**
   * Insert a Notify.
   * @param {NotifyCompletion} notify Notify to save.
   * @returns {NotifyCompletion} Created notify completion.
   */
  create: (notifyCompletion: NotifyCompletion) => Promise<NotifyCompletion>;
}
