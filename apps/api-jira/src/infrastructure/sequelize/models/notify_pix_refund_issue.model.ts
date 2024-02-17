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
  NotifyPixRefundIssue,
  NotifyPixRefundIssueEntity,
  NotifyStateType,
  NotifyEventType,
} from '@zro/api-jira/domain';
import {
  PixRefundReason,
  PixRefundRejectionReason,
  PixRefundStatus,
} from '@zro/pix-payments/domain';

type NotifyPixRefundIssueAttributes = NotifyPixRefundIssue;
type NotifyPixRefundIssueCreationAttributes = NotifyPixRefundIssueAttributes;

@Table({
  tableName: 'jira_notify_pix_refund_issues',
  timestamps: true,
  underscored: true,
})
export class NotifyPixRefundIssueModel
  extends DatabaseModel<
    NotifyPixRefundIssueAttributes,
    NotifyPixRefundIssueCreationAttributes
  >
  implements NotifyPixRefundIssue
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
  status!: PixRefundStatus;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: NotifyStateType;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId: string;

  @Column(DataType.STRING)
  description?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  reason!: PixRefundReason;

  @Column(DataType.TEXT)
  analysisDetails?: PixRefundReason;

  @Column(DataType.STRING)
  rejectionReason?: PixRefundRejectionReason;

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

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: NotifyPixRefundIssueCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): NotifyPixRefundIssue {
    const entity = new NotifyPixRefundIssueEntity(this.get({ plain: true }));
    return entity;
  }
}
