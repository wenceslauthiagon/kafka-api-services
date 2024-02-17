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
  NotifyEventType,
  NotifyStateType,
  NotifyUserWithdrawSettingRequestIssue,
  NotifyUserWithdrawSettingRequestIssueEntity,
} from '@zro/api-jira/domain';
import {
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';

type NotifyUserWithdrawSettingRequestIssueAttributes =
  NotifyUserWithdrawSettingRequestIssue;
type NotifyUserWithdrawSettingRequestIssueCreationAttributes =
  NotifyUserWithdrawSettingRequestIssueAttributes;

@Table({
  tableName: 'jira_notify_user_withdraw_setting_request_issues',
  timestamps: true,
  underscored: true,
})
export class NotifyUserWithdrawSettingRequestIssueModel
  extends DatabaseModel<
    NotifyUserWithdrawSettingRequestIssueAttributes,
    NotifyUserWithdrawSettingRequestIssueCreationAttributes
  >
  implements NotifyUserWithdrawSettingRequestIssue
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  issueId!: string;

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
  status!: UserWithdrawSettingRequestState;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: NotifyStateType;

  @AllowNull(false)
  @Column(DataType.UUID)
  userWithdrawSettingRequestId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  summary!: string;

  @Column(DataType.STRING)
  assigneeName?: string;

  @Column(DataType.STRING)
  creatorName?: string;

  @Column(DataType.STRING)
  reporterName?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  eventType: NotifyEventType;

  @Column(DataType.STRING)
  analysisResult?: UserWithdrawSettingRequestAnalysisResultType;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: NotifyUserWithdrawSettingRequestIssueCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): NotifyUserWithdrawSettingRequestIssue {
    const entity = new NotifyUserWithdrawSettingRequestIssueEntity(
      this.get({ plain: true }),
    );

    return entity;
  }
}
