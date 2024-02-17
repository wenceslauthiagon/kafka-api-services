import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyPixRefundIssueModel } from '@zro/api-jira/infrastructure';
import {
  NotifyPixRefundIssue,
  NotifyPixRefundIssueRepository,
} from '@zro/api-jira/domain';
import { PixRefundStatus } from '@zro/pix-payments/domain';

export class NotifyPixRefundIssueDatabaseRepository
  extends DatabaseRepository
  implements NotifyPixRefundIssueRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    notifyIssue: NotifyPixRefundIssueModel,
  ): NotifyPixRefundIssue {
    return notifyIssue?.toDomain() ?? null;
  }

  async create(
    notifyIssue: NotifyPixRefundIssue,
  ): Promise<NotifyPixRefundIssue> {
    const createdNotifyIssue =
      await NotifyPixRefundIssueModel.create<NotifyPixRefundIssueModel>(
        notifyIssue,
        {
          transaction: this.transaction,
        },
      );

    notifyIssue.createdAt = createdNotifyIssue.createdAt;

    return notifyIssue;
  }

  /**
   * Get notify issue by issueId.
   *
   * @param issueId Issue Id.
   * @returns Notify Issue if found or null otherwise.
   */
  async getByIssueId(issueId: number): Promise<NotifyPixRefundIssue> {
    return NotifyPixRefundIssueModel.findOne({
      where: { issueId },
      transaction: this.transaction,
    }).then(NotifyPixRefundIssueDatabaseRepository.toDomain);
  }

  /**
   * Get notify issue by id and update.
   *
   * @param notifyIssue Notify Issue to update.
   * @returns Notify Issue updated.
   */
  async update(
    notifyIssue: NotifyPixRefundIssue,
  ): Promise<NotifyPixRefundIssue> {
    await NotifyPixRefundIssueModel.update<NotifyPixRefundIssueModel>(
      notifyIssue,
      {
        where: { id: notifyIssue.id },
        transaction: this.transaction,
      },
    );

    return notifyIssue;
  }

  /**
   * Get notify issue by issueId and status.
   *
   * @param issueId Issue Id.
   * @param status refund status.
   * @returns Notify Issue if found or null otherwise.
   */
  async getByIssueIdAndStatus(
    issueId: number,
    status: PixRefundStatus,
  ): Promise<NotifyPixRefundIssue> {
    return NotifyPixRefundIssueModel.findOne({
      where: { issueId, status },
      transaction: this.transaction,
    }).then(NotifyPixRefundIssueDatabaseRepository.toDomain);
  }
}
