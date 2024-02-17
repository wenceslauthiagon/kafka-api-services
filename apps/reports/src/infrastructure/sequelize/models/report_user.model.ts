import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { ReportUser, ReportUserEntity } from '@zro/reports/domain';
import {
  Address,
  AddressEntity,
  Occupation,
  OccupationEntity,
  UserLegalAdditionalInfo,
  UserLegalAdditionalInfoEntity,
  Onboarding,
  OnboardingEntity,
  PersonType,
  User,
  UserEntity,
  UserState,
} from '@zro/users/domain';
import { Admin, AdminEntity } from '@zro/admin/domain';
import { UserLimit, UserLimitEntity } from '@zro/operations/domain';

type ReportUserAttributes = ReportUser & {
  userId?: string;
  fullName?: string;
  phoneNumber?: string;
  document?: string;
  userDeletedAt?: Date;
  userUpdatedAt?: Date;
  state?: UserState;
  email?: string;
  type?: PersonType;
  motherName?: string;
  birthDate?: Date;
  genre?: string;
  addressStreet?: string;
  addressNumber?: number;
  addressCity?: string;
  addressFederativeUnit?: string;
  addressCountry?: string;
  addressZipCode?: string;
  addressComplement?: string;
  onboardingUpdatedAt?: Date;
  onboardingPepSince?: string;
  occupationName?: string;
  cnae?: string;
  constitutionDesc?: string;
  overseasBranchesQty?: number;
  employeeQty?: number;
  isThirdPartyRelationship?: boolean;
  isCreditCardAdmin?: boolean;
  isPatrimonyTrust?: boolean;
  isPaymentFacilitator?: boolean;
  isRegulatedPld?: boolean;
  legalNaturityCode?: string;
  adminName?: string;
  dailyLimit?: number;
};

type ReportUserCreationAttributes = ReportUserAttributes;

@Table({
  tableName: 'report_users',
  timestamps: true,
  underscored: true,
})
export class ReportUserModel
  extends DatabaseModel<ReportUserAttributes, ReportUserCreationAttributes>
  implements ReportUser
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @Column(DataType.STRING)
  fullName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  phoneNumber!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  document!: string;

  @Column(DataType.DATE)
  userDeletedAt: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  userUpdatedAt!: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: UserState;

  @Column(DataType.STRING)
  email: string;

  @Column(DataType.STRING)
  type: PersonType;

  @Column(DataType.STRING)
  motherName: string;

  @Column(DataType.DATE)
  birthDate: Date;

  @Column(DataType.STRING)
  genre: string;

  @Column(DataType.STRING)
  addressStreet: string;

  @Column(DataType.INTEGER)
  addressNumber: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  addressCity!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  addressFederativeUnit!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  addressCountry: string;

  @Column(DataType.STRING)
  addressZipCode: string;

  @Column(DataType.STRING)
  addressComplement: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  onboardingUpdatedAt!: Date;

  @Column(DataType.STRING)
  onboardingPepSince: string;

  @Column(DataType.STRING)
  occupationName?: string;

  @Column(DataType.STRING)
  adminName: string;

  @Column(DataType.STRING)
  cnae?: string;

  @Column(DataType.STRING)
  constitutionDesc?: string;

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

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('dailyLimit'));
    },
  })
  dailyLimit: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  user: User;

  address: Address;

  onboarding: Onboarding;

  occupation?: Occupation;

  admin?: Admin;

  userLegalAdditionalInfo?: UserLegalAdditionalInfo;

  userLimit: UserLimit;

  constructor(values?: ReportUserAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.state = values?.state ?? values.user?.state;
    this.fullName = values?.fullName ?? values.user?.fullName;
    this.phoneNumber = values?.phoneNumber ?? values.user?.phoneNumber;
    this.email = values?.email ?? values.user?.email;
    this.document = values?.document ?? values.user?.document;
    this.userDeletedAt = values?.userDeletedAt ?? values.user?.deletedAt;
    this.userUpdatedAt = values?.userUpdatedAt ?? values.user?.updatedAt;
    this.type = values?.type ?? values.user?.type;
    this.motherName = values?.motherName ?? values.user?.motherName;
    this.birthDate = values?.birthDate ?? values.user?.birthDate;
    this.genre = values?.genre ?? values.user?.genre;
    this.addressStreet = values?.addressStreet ?? values.address?.street;
    this.addressNumber = values?.addressNumber ?? values.address?.number;
    this.addressCity = values?.addressCity ?? values.address?.city;
    this.addressFederativeUnit =
      values?.addressFederativeUnit ?? values.address?.federativeUnit;
    this.addressCountry = values?.addressCountry ?? values.address?.country;
    this.addressZipCode = values?.addressZipCode ?? values.address?.zipCode;
    this.addressComplement =
      values?.addressComplement ?? values.address?.complement;
    this.onboardingUpdatedAt =
      values?.onboardingUpdatedAt ?? values.onboarding?.updatedAt;
    this.onboardingPepSince =
      values?.onboardingPepSince ?? values.onboarding?.pepSince;
    this.occupationName = values?.occupationName ?? values.occupation?.name;
    this.adminName = values?.adminName ?? values.admin?.name;
    this.dailyLimit = values?.dailyLimit ?? values.userLimit?.dailyLimit;
    this.cnae = values?.cnae ?? values.userLegalAdditionalInfo?.cnae;
    this.constitutionDesc =
      values?.constitutionDesc ??
      values.userLegalAdditionalInfo?.constitutionDesc;
    this.employeeQty =
      values?.employeeQty ?? values?.userLegalAdditionalInfo?.employeeQty;
    this.overseasBranchesQty =
      values?.overseasBranchesQty ??
      values?.userLegalAdditionalInfo?.overseasBranchesQty;
    this.isThirdPartyRelationship =
      values?.isThirdPartyRelationship ??
      values?.userLegalAdditionalInfo?.isThirdPartyRelationship;
    this.isCreditCardAdmin =
      values?.isCreditCardAdmin ??
      values?.userLegalAdditionalInfo?.isCreditCardAdmin;
    this.isPatrimonyTrust =
      values?.isPatrimonyTrust ??
      values?.userLegalAdditionalInfo?.isPatrimonyTrust;
    this.isPaymentFacilitator =
      values?.isPaymentFacilitator ??
      values?.userLegalAdditionalInfo?.isPaymentFacilitator;
    this.isRegulatedPld =
      values?.isRegulatedPld ?? values?.userLegalAdditionalInfo?.isRegulatedPld;
    this.legalNaturityCode =
      values?.legalNaturityCode ??
      values?.userLegalAdditionalInfo?.legalNaturityCode;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): ReportUser {
    const entity = new ReportUserEntity(this.get({ plain: true }));

    entity.user = new UserEntity({
      uuid: this.userId,
      state: this.state,
      fullName: this.fullName,
      phoneNumber: this.phoneNumber,
      email: this.email,
      document: this.document,
      type: this.type,
      motherName: this.motherName,
      birthDate: this.birthDate,
      genre: this.genre,
      updatedAt: this.userUpdatedAt,
      deletedAt: this.userDeletedAt,
    });

    entity.address = new AddressEntity({
      street: this.addressStreet,
      number: this.addressNumber,
      city: this.addressCity,
      federativeUnit: this.addressFederativeUnit,
      country: this.addressCountry,
      zipCode: this.addressZipCode,
      complement: this.addressComplement,
    });

    entity.onboarding = new OnboardingEntity({
      updatedAt: this.onboardingUpdatedAt,
      pepSince: this.onboardingPepSince,
    });

    entity.userLegalAdditionalInfo = new UserLegalAdditionalInfoEntity({
      cnae: this.cnae,
      employeeQty: this.employeeQty,
      overseasBranchesQty: this.overseasBranchesQty,
      isThirdPartyRelationship: this.isThirdPartyRelationship,
      isCreditCardAdmin: this.isCreditCardAdmin,
      isPatrimonyTrust: this.isPatrimonyTrust,
      isPaymentFacilitator: this.isPaymentFacilitator,
      isRegulatedPld: this.isRegulatedPld,
      legalNaturityCode: this.legalNaturityCode,
    });

    if (this.adminName) {
      entity.admin = new AdminEntity({
        name: this.adminName,
      });
    }

    if (this.occupationName) {
      entity.occupation = new OccupationEntity({
        name: this.occupationName,
      });
    }

    entity.userLimit = new UserLimitEntity({
      dailyLimit: this.dailyLimit,
    });

    Reflect.deleteProperty(entity, 'userId');
    Reflect.deleteProperty(entity, 'state');
    Reflect.deleteProperty(entity, 'fullName');
    Reflect.deleteProperty(entity, 'phoneNumber');
    Reflect.deleteProperty(entity, 'email');
    Reflect.deleteProperty(entity, 'cpf');
    Reflect.deleteProperty(entity, 'updatedAt');
    Reflect.deleteProperty(entity, 'deletedAt');
    Reflect.deleteProperty(entity, 'type');
    Reflect.deleteProperty(entity, 'motherName');
    Reflect.deleteProperty(entity, 'birthDate');
    Reflect.deleteProperty(entity, 'genre');

    Reflect.deleteProperty(entity, 'addressStreet');
    Reflect.deleteProperty(entity, 'addressNumber');
    Reflect.deleteProperty(entity, 'addressCity');
    Reflect.deleteProperty(entity, 'addressFederativeUnit');
    Reflect.deleteProperty(entity, 'addressCountry');
    Reflect.deleteProperty(entity, 'addressZipCode');

    Reflect.deleteProperty(entity, 'cnae');
    Reflect.deleteProperty(entity, 'employeeQty');
    Reflect.deleteProperty(entity, 'overseasBranchesQty');
    Reflect.deleteProperty(entity, 'isThirdPartyRelationship');
    Reflect.deleteProperty(entity, 'isCreditCardAdmin');
    Reflect.deleteProperty(entity, 'isPatrimonyTrust');
    Reflect.deleteProperty(entity, 'isPaymentFacilitator');
    Reflect.deleteProperty(entity, 'isRegulatedPld');
    Reflect.deleteProperty(entity, 'legalNaturityCode');

    Reflect.deleteProperty(entity, 'onboardingUpdatedAt');
    Reflect.deleteProperty(entity, 'onboardingPepSince');

    Reflect.deleteProperty(entity, 'adminName');

    Reflect.deleteProperty(entity, 'dailyLimit');

    Reflect.deleteProperty(entity, 'occupationName');

    return entity;
  }
}
