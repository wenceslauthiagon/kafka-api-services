import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
  Default,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  BankingCashInBillet,
  BankingCashInBilletEntity,
  BankingCashInBilletStatus,
} from '@zro/banking/domain';
import { User, UserEntity } from '@zro/users/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';

type BankingCashInBilletAttributes = BankingCashInBillet & {
  userId: User['id'];
  operationId?: Operation['id'];
};
type BankingCashInBilletCreationAttributes = BankingCashInBilletAttributes;

@Table({
  tableName: 'BankingCashInBillets',
  timestamps: true,
  underscored: true,
})
export class BankingCashInBilletModel
  extends DatabaseModel<
    BankingCashInBilletAttributes,
    BankingCashInBilletCreationAttributes
  >
  implements BankingCashInBillet
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  barCode: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  number: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  thirdPartyNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  typeableLine: string;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('value'));
    },
  })
  value: number;

  @AllowNull(false)
  @Column(DataType.BLOB('tiny'))
  base64Pdf: string;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  dueDate: Date;

  @AllowNull(true)
  @Column(DataType.DATEONLY)
  settledDate?: Date;

  @AllowNull(false)
  @Default(BankingCashInBilletStatus.PENDING)
  @Column(DataType.STRING)
  status: BankingCashInBilletStatus;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  userId: User['id'];
  user: User;

  @AllowNull(true)
  @Column(DataType.UUID)
  operationId: Operation['id'];
  operation?: Operation;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: BankingCashInBilletCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.userId = values?.userId ?? values?.user?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): BankingCashInBillet {
    const entity = new BankingCashInBilletEntity(this.get({ plain: true }));

    entity.operation =
      this.operationId &&
      new OperationEntity({
        id: this.operationId,
      });

    entity.user = new UserEntity({
      id: this.userId,
    });

    delete entity['operationId'];
    delete entity['userId'];

    return entity;
  }
}
