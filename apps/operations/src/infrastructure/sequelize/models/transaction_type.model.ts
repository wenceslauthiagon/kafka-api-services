import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  Default,
  ForeignKey,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { DatabaseModel } from '@zro/common';
import { BuildOptions, Optional } from 'sequelize';
import {
  TransactionType,
  TransactionTypeEntity,
  TransactionTypeState,
  TransactionTypeParticipants,
  LimitTypeEntity,
} from '@zro/operations/domain';
import { LimitTypeModel } from './limit_type.model';

export type TransactionTypeAttributes = TransactionType & {
  limitTypeId?: number;
};
export type TransactionTypeCreationAttributes = Optional<
  TransactionTypeAttributes,
  'id'
>;

@Table({
  tableName: 'Transaction_types',
  timestamps: false,
  underscored: true,
})
export class TransactionTypeModel
  extends DatabaseModel<
    TransactionTypeAttributes,
    TransactionTypeCreationAttributes
  >
  implements TransactionType
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id?: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  title!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  tag!: string;

  // FIXME: remove legacy column
  @AllowNull(false)
  @Default('A2B')
  @Column(DataType.STRING)
  method!: string;

  @AllowNull(false)
  @Default(TransactionTypeState.ACTIVE)
  @Column(DataType.STRING)
  state!: TransactionTypeState;

  // FIXME: remove legacy column
  @AllowNull(false)
  @Default('')
  @Column({
    field: 'foreign_descr_in_str',
    type: DataType.STRING,
  })
  foreignDescriptionInString!: string;

  // FIXME: remove legacy column
  @AllowNull(false)
  @Default('')
  @Column({
    field: 'foreign_descr_out_str',
    type: DataType.STRING,
  })
  foreignDescriptionOutString!: string;

  @AllowNull(false)
  @Column(DataType.ENUM({ values: Object.values(TransactionTypeParticipants) }))
  participants!: TransactionTypeParticipants;

  @ForeignKey(() => LimitTypeModel)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  limitTypeId: number;

  limitType?: LimitTypeModel;

  constructor(
    values?: TransactionTypeCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.limitTypeId = values?.limitTypeId ?? values?.limitType?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): TransactionTypeEntity {
    const entity = new TransactionTypeEntity(this.get({ plain: true }));

    if (this.limitType) {
      entity.limitType = this.limitType.toDomain();
    } else if (this.limitTypeId) {
      entity.limitType = new LimitTypeEntity({ id: this.limitTypeId });
    }

    return entity;
  }

  isActive(): boolean {
    return this.toDomain().isActive();
  }

  isBothParticipantsRequired(): boolean {
    return this.toDomain().isBothParticipantsRequired();
  }

  isOwnerParticipantsRequired(): boolean {
    return this.toDomain().isOwnerParticipantsRequired();
  }

  isBeneficiaryParticipantsRequired(): boolean {
    return this.toDomain().isBeneficiaryParticipantsRequired();
  }
}
