import { BuildOptions } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  BelongsTo,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  UserLegalAdditionalInfo,
  UserLegalAdditionalInfoEntity,
  UserEntity,
} from '@zro/users/domain';
import { UserModel } from './user.model';
import { User } from '@zro/users/domain';

export type UserLegalAdditionalInfoAttributes = UserLegalAdditionalInfo & {
  userId: User['uuid'];
};
export type UserLegalAdditionalInfoCreationAttributes =
  UserLegalAdditionalInfoAttributes;

@Table({
  tableName: 'users_legal_additional_info',
  timestamps: true,
  underscored: true,
})
export class UserLegalAdditionalInfoModel
  extends Model<
    UserLegalAdditionalInfoAttributes,
    UserLegalAdditionalInfoCreationAttributes
  >
  implements UserLegalAdditionalInfo
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

  @Column(DataType.STRING)
  constitutionDesc?: string;

  @Column(DataType.INTEGER)
  cnae?: string;

  @Column(DataType.INTEGER)
  employeeQty?: number;

  @Column(DataType.INTEGER)
  overseasBranchesQty?: number;

  @Column(DataType.BOOLEAN)
  isThirdPartyRelationship?: boolean;

  @Column(DataType.BOOLEAN)
  isCreditCardAdmin?: boolean;

  @Column(DataType.BOOLEAN)
  isPatrimonyTrust?: boolean;

  @Column(DataType.BOOLEAN)
  isPaymentFacilitator?: boolean;

  @Column(DataType.BOOLEAN)
  isRegulatedPld?: boolean;

  @Column(DataType.STRING)
  legalNaturityCode?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => UserModel)
  user: UserModel;

  constructor(
    values?: UserLegalAdditionalInfoCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserLegalAdditionalInfo {
    const entity = new UserLegalAdditionalInfoEntity(this.get({ plain: true }));

    if (this.user) {
      entity.user = this.user.toDomain();
    } else if (this.userId) {
      entity.user = new UserEntity({ uuid: this.userId });
    }

    Reflect.deleteProperty(entity, 'userId');

    return entity;
  }
}
