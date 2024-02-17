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
  WarningPixDeposit,
  WarningPixDepositEntity,
  WarningPixDepositState,
} from '@zro/pix-payments/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';

type WarningPixDepositAttributes = WarningPixDeposit & {
  operationId?: Operation['id'];
  userId?: User['uuid'];
};
type WarningPixDepositCreationAttributes = WarningPixDepositAttributes;

@Table({
  tableName: 'warning_pix_deposits',
  timestamps: true,
  underscored: true,
})
export class WarningPixDepositModel
  extends DatabaseModel<
    WarningPixDepositAttributes,
    WarningPixDepositCreationAttributes
  >
  implements WarningPixDeposit
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId: string;
  operation: Operation;

  @AllowNull(false)
  @Column(DataType.STRING)
  transactionTag: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId: string;
  user: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: WarningPixDepositState;

  @Column(DataType.STRING)
  rejectedReason?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: WarningPixDepositAttributes, options?: BuildOptions) {
    super(values, options);
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.userId = values?.userId ?? values?.user?.uuid;
  }
  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): WarningPixDeposit {
    const entity = new WarningPixDepositEntity(this.get({ plain: true }));
    entity.operation =
      this.operationId && new OperationEntity({ id: this.operationId });
    entity.user = this.userId && new UserEntity({ uuid: this.userId });
    return entity;
  }
}
