import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel, Failed, FailedEntity } from '@zro/common';
import { PersonType } from '@zro/users/domain';
import {
  PixFraudDetection,
  PixFraudDetectionEntity,
  PixFraudDetectionState,
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';

type PixFraudDetectionAtUsertributes = PixFraudDetection & {
  failedCode?: string;
  failedMessage?: string;
};
type PixFraudDetectionCreationAttributes = PixFraudDetectionAtUsertributes;

@Table({
  tableName: 'pix_fraud_detections',
  timestamps: true,
  underscored: true,
})
export class PixFraudDetectionModel
  extends DatabaseModel<
    PixFraudDetectionAtUsertributes,
    PixFraudDetectionCreationAttributes
  >
  implements PixFraudDetection
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id: string;

  @Column(DataType.UUID)
  externalId?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  personType: PersonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  document: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  fraudType: PixFraudDetectionType;

  @Column(DataType.STRING)
  key?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  status: PixFraudDetectionStatus;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: PixFraudDetectionState;

  @Column(DataType.INTEGER)
  issueId?: number;

  @Column(DataType.STRING)
  failedMessage?: string;

  @Column(DataType.STRING)
  failedCode?: string;
  failed?: Failed;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: PixFraudDetectionCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.failedCode = values?.failedCode ?? values?.failed?.code ?? null;
    this.failedMessage =
      values?.failedMessage ?? values?.failed?.message ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PixFraudDetection {
    const entity = new PixFraudDetectionEntity(this.get({ plain: true }));

    entity.failed =
      this.failedCode &&
      this.failedMessage &&
      new FailedEntity({
        code: this.failedCode,
        message: this.failedMessage,
      });

    delete entity['failedCode'];
    delete entity['failedMessage'];

    return entity;
  }
}
