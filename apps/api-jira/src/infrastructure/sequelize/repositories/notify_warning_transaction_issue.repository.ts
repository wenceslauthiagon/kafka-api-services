import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyWarningTransactionIssueModel } from '@zro/api-jira/infrastructure';
import {
  NotifyWarningTransactionIssue,
  NotifyWarningTransactionIssueRepository,
} from '@zro/api-jira/domain';
import { WarningTransactionStatus } from '@zro/compliance/domain';

export class NotifyWarningTransactionIssueDatabaseRepository
  extends DatabaseRepository
  implements NotifyWarningTransactionIssueRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    notifyIssue: NotifyWarningTransactionIssueModel,
  ): NotifyWarningTransactionIssue {
    return notifyIssue?.toDomain() ?? null;
  }

  async create(
    notifyIssue: NotifyWarningTransactionIssue,
  ): Promise<NotifyWarningTransactionIssue> {
    const createdNotifyIssue =
      await NotifyWarningTransactionIssueModel.create<NotifyWarningTransactionIssueModel>(
        notifyIssue,
        { transaction: this.transaction },
      );

    notifyIssue.createdAt = createdNotifyIssue.createdAt;

    return notifyIssue;
  }

  /**
   * Get notify issue by issueId and status.
   *
   * @param issueId Issue Id.
   * @param status warning transaction status.
   * @returns Notify Issue if found or null otherwise.
   */
  async getByIssueIdAndStatus(
    issueId: number,
    status: WarningTransactionStatus,
  ): Promise<NotifyWarningTransactionIssue> {
    return NotifyWarningTransactionIssueModel.findOne({
      where: { issueId, status },
      transaction: this.transaction,
    }).then(NotifyWarningTransactionIssueDatabaseRepository.toDomain);
  }
}
