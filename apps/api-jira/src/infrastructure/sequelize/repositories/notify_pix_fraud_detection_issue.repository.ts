import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyPixFraudDetectionIssueModel } from '@zro/api-jira/infrastructure';
import {
  NotifyPixFraudDetectionIssue,
  NotifyPixFraudDetectionIssueRepository,
} from '@zro/api-jira/domain';
import { PixFraudDetectionStatus } from '@zro/pix-payments/domain';

export class NotifyPixFraudDetectionIssueDatabaseRepository
  extends DatabaseRepository
  implements NotifyPixFraudDetectionIssueRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    notifyIssue: NotifyPixFraudDetectionIssueModel,
  ): NotifyPixFraudDetectionIssue {
    return notifyIssue?.toDomain() ?? null;
  }

  async create(
    notifyIssue: NotifyPixFraudDetectionIssue,
  ): Promise<NotifyPixFraudDetectionIssue> {
    const createdNotifyIssue =
      await NotifyPixFraudDetectionIssueModel.create<NotifyPixFraudDetectionIssueModel>(
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
  async getByIssueId(issueId: number): Promise<NotifyPixFraudDetectionIssue> {
    return NotifyPixFraudDetectionIssueModel.findOne({
      where: { issueId },
      transaction: this.transaction,
    }).then(NotifyPixFraudDetectionIssueDatabaseRepository.toDomain);
  }

  /**
   * Get notify issue by id and update.
   *
   * @param notifyIssue Notify Issue to update.
   * @returns Notify Issue updated.
   */
  async update(
    notifyIssue: NotifyPixFraudDetectionIssue,
  ): Promise<NotifyPixFraudDetectionIssue> {
    await NotifyPixFraudDetectionIssueModel.update<NotifyPixFraudDetectionIssueModel>(
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
   * @param status Fraud detection status.
   * @returns Notify Issue if found or null otherwise.
   */
  async getByIssueIdAndStatus(
    issueId: number,
    status: PixFraudDetectionStatus,
  ): Promise<NotifyPixFraudDetectionIssue> {
    return NotifyPixFraudDetectionIssueModel.findOne({
      where: { issueId, status },
      transaction: this.transaction,
    }).then(NotifyPixFraudDetectionIssueDatabaseRepository.toDomain);
  }
}
