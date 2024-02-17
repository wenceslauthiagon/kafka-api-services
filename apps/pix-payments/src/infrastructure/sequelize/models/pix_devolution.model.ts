import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel, Failed, FailedEntity } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Operation,
  OperationEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import {
  PixDepositEntity,
  PixDevolution,
  PixDevolutionCode,
  PixDevolutionEntity,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import { PixDepositModel } from './pix_deposit.model';

type DevolutionAttributes = PixDevolution & {
  userId?: string;
  walletId?: string;
  depositId?: string;
  operationId?: string;
  failedCode?: string;
  failedMessage?: string;
};
type DevolutionCreationAttributes = DevolutionAttributes;

@Table({
  tableName: 'pix_devolutions',
  timestamps: true,
  underscored: true,
})
export class PixDevolutionModel
  extends DatabaseModel<DevolutionAttributes, DevolutionCreationAttributes>
  implements PixDevolution
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user!: User;

  @AllowNull(false)
  @Column(DataType.UUID)
  walletId!: string;
  wallet: Wallet;

  @ForeignKey(() => PixDepositModel)
  @AllowNull(false)
  @Column(DataType.UUID)
  depositId!: string;

  @BelongsTo(() => PixDepositModel)
  deposit!: PixDepositModel;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId!: string;
  operation!: Operation;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: PixDevolutionState;

  @Column(DataType.STRING)
  endToEndId: string;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount!: number;

  @Column(DataType.STRING)
  devolutionCode: PixDevolutionCode;

  @Column(DataType.STRING)
  description: string;

  @Column(DataType.STRING)
  chargebackReason?: string;

  @Column(DataType.STRING)
  failedMessage?: string;

  @Column(DataType.STRING)
  failedCode?: string;
  failed?: Failed;

  @Column(DataType.UUID)
  externalId?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: DevolutionAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.walletId = values?.walletId ?? values?.wallet?.uuid;
    this.depositId = values?.depositId ?? values?.deposit?.id;
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.failedCode = values?.failedCode ?? values?.failed?.code ?? null;
    this.failedMessage =
      values?.failedMessage ?? values?.failed?.message ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PixDevolution {
    const entity = new PixDevolutionEntity(this.get({ plain: true }));
    entity.operation = new OperationEntity({ id: this.operationId });
    entity.user = new UserEntity({ uuid: this.userId });
    entity.wallet = new WalletEntity({ uuid: this.walletId });
    entity.failed =
      this.failedCode &&
      this.failedMessage &&
      new FailedEntity({
        code: this.failedCode,
        message: this.failedMessage,
      });

    // The deposit exists if the devolutionRepository includes the depositModel in the query,
    // otherwise, only the depositId exists.
    if (this.deposit) {
      entity.deposit = this.deposit.toDomain();
    } else if (this.depositId) {
      entity.deposit = new PixDepositEntity({ id: this.depositId });
    }

    delete entity['operationId'];
    delete entity['userId'];
    delete entity['walletId'];
    delete entity['depositId'];
    delete entity['failedCode'];
    delete entity['failedMessage'];

    return entity;
  }

  hasReceipt(): boolean {
    return this.toDomain().hasReceipt();
  }
}
