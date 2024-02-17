import { BuildOptions, Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Address, AddressEntity, UserEntity } from '@zro/users/domain';
import { UserModel } from './user.model';

export type AddressAttributes = Address & { userId?: number };
export type AddressCreationAttributes = Optional<AddressAttributes, 'id'>;

@Table({
  tableName: 'Addresses',
  timestamps: true,
  underscored: true,
})
export class AddressModel
  extends Model<AddressAttributes, AddressCreationAttributes>
  implements Address
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  userId!: number;

  @Column({
    type: DataType.STRING,
    field: 'zipCode',
  })
  zipCode: string;

  @Column(DataType.STRING)
  street: string;

  @Column(DataType.INTEGER)
  number: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  neighborhood!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  city!: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    field: 'federativeUnit',
  })
  federativeUnit!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  country!: string;

  @Column(DataType.STRING)
  complement?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => UserModel)
  user: UserModel;

  constructor(values?: AddressCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Address {
    const entity = new AddressEntity(this.get({ plain: true }));

    // The user exists if the onboarding repository includes the userModel in the query,
    // otherwise, only the userId exists.
    if (this.user) {
      entity.user = this.user.toDomain();
    } else if (this.userId) {
      entity.user = new UserEntity({ id: this.userId });
    }
    return entity;
  }
}
