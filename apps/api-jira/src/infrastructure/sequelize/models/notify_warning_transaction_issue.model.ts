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
  NotifyWarningTransactionIssue,
  NotifyWarningTransactionIssueEntity,
} from '@zro/api-jira/domain';
import {
  WarningTransactionAnalysisResultType,
  WarningTransactionStatus,
} from '@zro/compliance/domain';

type NotifyWarningTransactionIssueAttributes = NotifyWarningTransactionIssue;
type NotifyWarningTransactionIssueCreationAttributes =
  NotifyWarningTransactionIssueAttributes;

@Table({
  tableName: 'jira_notify_warning_transaction_issues',
  timestamps: true,
  underscored: true,
})
export class NotifyWarningTransactionIssueModel
  extends DatabaseModel<
    NotifyWarningTransactionIssueAttributes,
    NotifyWarningTransactionIssueCreationAttributes
  >
  implements NotifyWarningTransactionIssue
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
  status!: WarningTransactionStatus;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: NotifyStateType;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId: string;

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
  analysisResult?: WarningTransactionAnalysisResultType;

  @Column(DataType.TEXT)
  analysisDetails?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: NotifyWarningTransactionIssueCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): NotifyWarningTransactionIssue {
    const entity = new NotifyWarningTransactionIssueEntity(
      this.get({ plain: true }),
    );
    return entity;
  }
}
