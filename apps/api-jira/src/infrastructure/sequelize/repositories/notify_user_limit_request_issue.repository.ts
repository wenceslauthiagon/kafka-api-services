import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyUserLimitRequestIssueModel } from '@zro/api-jira/infrastructure';
import {
  NotifyUserLimitRequestIssue,
  NotifyUserLimitRequestIssueRepository,
} from '@zro/api-jira/domain';

export class NotifyUserLimitRequestIssueDatabaseRepository
  extends DatabaseRepository
  implements NotifyUserLimitRequestIssueRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    notifyIssue: NotifyUserLimitRequestIssueModel,
  ): NotifyUserLimitRequestIssue {
    return notifyIssue?.toDomain() ?? null;
  }

  async create(
    notifyIssue: NotifyUserLimitRequestIssue,
  ): Promise<NotifyUserLimitRequestIssue> {
    const createdNotifyIssue =
      await NotifyUserLimitRequestIssueModel.create<NotifyUserLimitRequestIssueModel>(
        notifyIssue,
        {
          transaction: this.transaction,
        },
      );

    notifyIssue.createdAt = createdNotifyIssue.createdAt;

    return notifyIssue;
  }
}
