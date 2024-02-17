import { DatabaseRepository } from '@zro/common';
import { NotifyUserWithdrawSettingRequestIssueModel } from '@zro/api-jira/infrastructure';
import {
  NotifyUserWithdrawSettingRequestIssue,
  NotifyUserWithdrawSettingRequestIssueRepository,
} from '@zro/api-jira/domain';
import { UserWithdrawSettingRequestState } from '@zro/compliance/domain';

export class NotifyUserWithdrawSettingRequestIssueDatabaseRepository
  extends DatabaseRepository
  implements NotifyUserWithdrawSettingRequestIssueRepository
{
  static toDomain(
    notifyIssue: NotifyUserWithdrawSettingRequestIssueModel,
  ): NotifyUserWithdrawSettingRequestIssue {
    return notifyIssue?.toDomain() ?? null;
  }

  async create(
    notifyIssue: NotifyUserWithdrawSettingRequestIssue,
  ): Promise<NotifyUserWithdrawSettingRequestIssue> {
    const createdNotifyIssue =
      await NotifyUserWithdrawSettingRequestIssueModel.create<NotifyUserWithdrawSettingRequestIssueModel>(
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
   * @param status  user withdraw setting request status.
   * @returns Notify Issue if found or null otherwise.
   */
  async getByIssueIdAndStatus(
    issueId: string,
    status: UserWithdrawSettingRequestState,
  ): Promise<NotifyUserWithdrawSettingRequestIssue> {
    return NotifyUserWithdrawSettingRequestIssueModel.findOne({
      where: { issueId, status },
      transaction: this.transaction,
    }).then(NotifyUserWithdrawSettingRequestIssueDatabaseRepository.toDomain);
  }
}
