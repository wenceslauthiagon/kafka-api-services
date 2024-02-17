import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyPixInfractionIssueModel } from '@zro/api-jira/infrastructure';
import {
  NotifyPixInfractionIssue,
  NotifyPixInfractionIssueRepository,
} from '@zro/api-jira/domain';
import { PixInfractionStatus } from '@zro/pix-payments/domain';

export class NotifyPixInfractionIssueDatabaseRepository
  extends DatabaseRepository
  implements NotifyPixInfractionIssueRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    notifyIssue: NotifyPixInfractionIssueModel,
  ): NotifyPixInfractionIssue {
    return notifyIssue?.toDomain() ?? null;
  }

  async create(
    notifyIssue: NotifyPixInfractionIssue,
  ): Promise<NotifyPixInfractionIssue> {
    const createdNotifyIssue =
      await NotifyPixInfractionIssueModel.create<NotifyPixInfractionIssueModel>(
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
  async getByIssueId(issueId: number): Promise<NotifyPixInfractionIssue> {
    return NotifyPixInfractionIssueModel.findOne({
      where: { issueId },
      transaction: this.transaction,
    }).then(NotifyPixInfractionIssueDatabaseRepository.toDomain);
  }

  /**
   * Get notify issue by id and update.
   *
   * @param notifyIssue Notify Issue to update.
   * @returns Notify Issue updated.
   */
  async update(
    notifyIssue: NotifyPixInfractionIssue,
  ): Promise<NotifyPixInfractionIssue> {
    await NotifyPixInfractionIssueModel.update<NotifyPixInfractionIssueModel>(
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
   * @param status infraction status.
   * @returns Notify Issue if found or null otherwise.
   */
  async getByIssueIdAndStatus(
    issueId: number,
    status: PixInfractionStatus,
  ): Promise<NotifyPixInfractionIssue> {
    return NotifyPixInfractionIssueModel.findOne({
      where: { issueId, status },
      transaction: this.transaction,
    }).then(NotifyPixInfractionIssueDatabaseRepository.toDomain);
  }
}
