import { NotifyCreditDevolution } from '@zro/api-jdpi/domain';

export interface NotifyCreditDevolutionRepository {
  /**
   * Creates a NotifyCreditDevolution.
   * @param notifyCreditDevolution NotifyCreditDevolution to save.
   * @returns Created NotifyCreditDevolution.
   */
  create: (
    notifyCreditDevolution: NotifyCreditDevolution,
  ) => Promise<NotifyCreditDevolution>;
}
