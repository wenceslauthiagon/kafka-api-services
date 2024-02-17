import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  NotifyUserLimitRequestIssue,
  NotifyUserLimitRequestIssueEntity,
  UserLimitRequestNotifyEventType,
  UserLimitRequestNotifyStateType,
} from '@zro/api-jira/domain';
import { UserLimitRequestStatus } from '@zro/compliance/domain';

type NotifyUserLimitRequestIssueAttributes = NotifyUserLimitRequestIssue;
type NotifyUserLimitRequestIssueCreationAttributes =
  NotifyUserLimitRequestIssueAttributes;

@Table({
  tableName: 'jira_notify_user_limit_request_issues',
  timestamps: true,
  underscored: true,
})
export class NotifyUserLimitRequestIssueModel
  extends DatabaseModel<
    NotifyUserLimitRequestIssueAttributes,
    NotifyUserLimitRequestIssueCreationAttributes
  >
  implements NotifyUserLimitRequestIssue
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  issueId!: number;

  @Column(DataType.INTEGER)
  issueTypeId?: number;

  @Column(DataType.STRING)
  issueTypeName?: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  issueCreatedAt: Date;

  @Column(DataType.INTEGER)
  projectId?: number;

  @Column(DataType.STRING)
  projectKey?: string;

  @Column(DataType.STRING)
  projectName?: string;

  @Column(DataType.INTEGER)
  priorityId?: number;

  @Column(DataType.STRING)
  priorityName?: string;

  @Column(DataType.INTEGER)
  statusId?: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: UserLimitRequestStatus;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: UserLimitRequestNotifyStateType;

  @AllowNull(false)
  @Column(DataType.STRING)
  summary!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userLimitRequestId: string;

  @Column(DataType.STRING)
  assigneeName?: string;

  @Column(DataType.STRING)
  creatorName?: string;

  @Column(DataType.STRING)
  reporterName?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  eventType: UserLimitRequestNotifyEventType;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: NotifyUserLimitRequestIssueCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): NotifyUserLimitRequestIssue {
    const entity = new NotifyUserLimitRequestIssueEntity(
      this.get({ plain: true }),
    );
    return entity;
  }
}
