import { BuildOptions, Optional } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  User,
  PersonType,
  UserLegalRepresentor,
  AddressLegalRepresentor,
  RepresentorType,
  UserLegalRepresentorEntity,
  UserEntity,
  AddressLegalRepresentorEntity,
} from '@zro/users/domain';
import { UserModel } from './user.model';
import { AddressLegalRepresentorModel } from './address_legal_representor.model';

export type UserLegalRepresentorAttributes = UserLegalRepresentor & {
  userId?: User['uuid'];
  addressId?: AddressLegalRepresentor['id'];
};
export type UserLegalRepresentorCreationAttributes = Optional<
  UserLegalRepresentorAttributes,
  'id'
>;

@Table({
  tableName: 'users_legal_representor',
  timestamps: true,
  underscored: true,
})
export class UserLegalRepresentorModel
  extends Model<
    UserLegalRepresentorAttributes,
    UserLegalRepresentorCreationAttributes
  >
  implements UserLegalRepresentor
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId: string;

  @ForeignKey(() => AddressLegalRepresentorModel)
  @Column(DataType.UUID)
  addressId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  personType: PersonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  document: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  birthDate: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: RepresentorType;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isPublicServer: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => UserModel)
  user: UserModel;

  @BelongsTo(() => AddressLegalRepresentorModel)
  address?: AddressLegalRepresentorModel;

  constructor(
    values?: UserLegalRepresentorCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.addressId = values?.addressId ?? values?.address?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserLegalRepresentor {
    const entity = new UserLegalRepresentorEntity(this.get({ plain: true }));

    if (this.user) {
      entity.user = this.user.toDomain();
    } else if (this.userId) {
      entity.user = new UserEntity({ uuid: this.userId });
    }

    if (this.address) {
      entity.address = this.address.toDomain();
    } else if (this.addressId) {
      entity.address = new AddressLegalRepresentorEntity({
        id: this.addressId,
      });
    }

    Reflect.deleteProperty(entity, 'userId');
    Reflect.deleteProperty(entity, 'addressId');

    return entity;
  }
}
