import { NotifyCreditValidation } from '@zro/api-jdpi/domain';

export interface NotifyCreditValidationRepository {
  /**
   * Create a NotifyCreditValidation.
   * @param notifyCreditValidation NotifyCreditValidation to save.
   * @returns Created NotifyCreditValidation.
   */
  create: (
    notifyCreditValidation: NotifyCreditValidation,
  ) => Promise<NotifyCreditValidation>;

  /**
   * Find a NotifyCreditValidation by id.
   * @param id NotifyCreditValidation id.
   * @returns NotifyCreditValidation.
   */
  getById: (id: string) => Promise<NotifyCreditValidation>;
}
