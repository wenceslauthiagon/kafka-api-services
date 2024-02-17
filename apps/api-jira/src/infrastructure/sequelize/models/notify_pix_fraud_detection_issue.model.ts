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
  NotifyPixFraudDetectionIssue,
  NotifyPixFraudDetectionIssueEntity,
  NotifyStateType,
  NotifyEventType,
} from '@zro/api-jira/domain';
import {
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';

type NotifyPixFraudDetectionIssueAttributes = NotifyPixFraudDetectionIssue;
type NotifyPixFraudDetectionIssueCreationAttributes =
  NotifyPixFraudDetectionIssueAttributes;

@Table({
  tableName: 'jira_notify_pix_fraud_detection_issues',
  timestamps: true,
  underscored: true,
})
export class NotifyPixFraudDetectionIssueModel
  extends DatabaseModel<
    NotifyPixFraudDetectionIssueAttributes,
    NotifyPixFraudDetectionIssueCreationAttributes
  >
  implements NotifyPixFraudDetectionIssue
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
  status!: PixFraudDetectionStatus;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: NotifyStateType;

  @AllowNull(false)
  @Column(DataType.STRING)
  summary!: string;

  @Column(DataType.STRING)
  externalId?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  document!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  fraudType!: PixFraudDetectionType;

  @Column(DataType.STRING)
  key?: string;

  @Column(DataType.STRING)
  assigneeName?: string;

  @Column(DataType.STRING)
  creatorName?: string;

  @Column(DataType.STRING)
  reporterName?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  eventType: NotifyEventType;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: NotifyPixFraudDetectionIssueCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): NotifyPixFraudDetectionIssue {
    const entity = new NotifyPixFraudDetectionIssueEntity(
      this.get({ plain: true }),
    );
    return entity;
  }
}
