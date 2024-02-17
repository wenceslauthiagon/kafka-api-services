import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  PixInfraction,
  PixInfractionEntity,
  PixInfractionRefundOperation,
  PixInfractionRefundOperationEntity,
  PixInfractionRefundOperationState,
  PixRefund,
  PixRefundEntity,
} from '@zro/pix-payments/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';

type PixInfractionRefundOperationAttributes = PixInfractionRefundOperation & {
  userId: User['uuid'];
  pixInfractionId?: PixInfraction['id'];
  pixRefundId?: PixRefund['id'];
  originalOperationId: Operation['id'];
  originalOperationValue: Operation['value'];
  refundOperationId: Operation['id'];
  refundOperationValue: Operation['value'];
};

type PixInfractionRefundOperationCreationAttributes =
  PixInfractionRefundOperationAttributes;

@Table({
  tableName: 'pix_infractions_refund_operations',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class PixInfractionRefundOperationModel
  extends DatabaseModel<
    PixInfractionRefundOperationAttributes,
    PixInfractionRefundOperationCreationAttributes
  >
  implements PixInfractionRefundOperation
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: PixInfractionRefundOperationState;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId: User['uuid'];
  user: User;

  @Column(DataType.UUID)
  pixInfractionId?: PixInfraction['id'];
  pixInfraction?: PixInfraction;

  @Column(DataType.UUID)
  pixRefundId?: PixRefund['id'];
  pixRefund?: PixRefund;

  @AllowNull(false)
  @Column(DataType.UUID)
  originalOperationId: Operation['id'];

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('originalOperationValue'));
    },
  })
  originalOperationValue: Operation['value'];
  originalOperation: Operation;

  @AllowNull(false)
  @Column(DataType.UUID)
  refundOperationId: Operation['id'];

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('refundOperationValue'));
    },
  })
  refundOperationValue: Operation['value'];
  refundOperation: Operation;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  constructor(
    values?: PixInfractionRefundOperationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);

    this.userId = values?.userId ?? values?.user?.uuid;
    this.pixInfractionId = values?.pixInfractionId ?? values?.pixInfraction?.id;
    this.pixRefundId = values?.pixRefundId ?? values?.pixRefund?.id;
    this.originalOperationId =
      values?.originalOperationId ?? values?.originalOperation?.id;
    this.originalOperationValue =
      values?.originalOperationValue ?? values?.originalOperation?.value;
    this.refundOperationId =
      values?.refundOperationId ?? values?.refundOperation?.id;
    this.refundOperationValue =
      values?.refundOperationValue ?? values?.refundOperation?.value;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PixInfractionRefundOperation {
    const entity = new PixInfractionRefundOperationEntity(
      this.get({ plain: true }),
    );
    entity.user = new UserEntity({
      uuid: this.userId,
    });
    entity.pixInfraction =
      this.pixInfractionId &&
      new PixInfractionEntity({
        id: this.pixInfractionId,
      });
    entity.pixRefund =
      this.pixRefundId &&
      new PixRefundEntity({
        id: this.pixRefundId,
      });
    entity.originalOperation = new OperationEntity({
      id: this.originalOperationId,
      value: this.originalOperationValue,
    });
    entity.refundOperation = new OperationEntity({
      id: this.refundOperationId,
      value: this.refundOperationValue,
    });

    Reflect.deleteProperty(entity, 'userId');
    Reflect.deleteProperty(entity, 'pixInfractionId');
    Reflect.deleteProperty(entity, 'pixRefundId');
    Reflect.deleteProperty(entity, 'originalOperationId');
    Reflect.deleteProperty(entity, 'originalOperationValue');
    Reflect.deleteProperty(entity, 'refundOperationId');
    Reflect.deleteProperty(entity, 'refundOperationValue');

    return entity;
  }
}
