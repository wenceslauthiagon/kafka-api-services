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
  ReportUserLegalRepresentor,
  ReportUserLegalRepresentorEntity,
} from '@zro/reports/domain';
import {
  AddressLegalRepresentorEntity,
  UserEntity,
  UserLegalRepresentor,
  UserLegalRepresentorEntity,
} from '@zro/users/domain';

type UserLegalRepresentorId = UserLegalRepresentor['id'];
type PersonType = UserLegalRepresentor['personType'];
type Document = UserLegalRepresentor['document'];
type Name = UserLegalRepresentor['name'];
type BirthDate = UserLegalRepresentor['birthDate'];
type Type = UserLegalRepresentor['type'];
type IsPublicServer = UserLegalRepresentor['isPublicServer'];
type UserLegalRepresentorCreatedAt = UserLegalRepresentor['createdAt'];
type UserLegalRepresentorUpdatedAt = UserLegalRepresentor['updatedAt'];

type UserId = UserLegalRepresentor['user']['uuid'];
type UserDocument = UserLegalRepresentor['user']['document'];

type AddressZipCode = UserLegalRepresentor['address']['zipCode'];
type AddressStreet = UserLegalRepresentor['address']['street'];
type AddressNumber = UserLegalRepresentor['address']['number'];
type AddressNeighborhood = UserLegalRepresentor['address']['neighborhood'];
type AddressCity = UserLegalRepresentor['address']['city'];
type AddressFederativeUnit = UserLegalRepresentor['address']['federativeUnit'];
type AddressCountry = UserLegalRepresentor['address']['country'];
type AddressComplement = UserLegalRepresentor['address']['complement'];

type ReportUserLegalRepresentorAttributes = ReportUserLegalRepresentor & {
  userLegalRepresentorId: UserLegalRepresentorId;
  personType: PersonType;
  document: Document;
  name: Name;
  birthDate: BirthDate;
  type: Type;
  isPublicServer: IsPublicServer;
  userLegalRepresentorCreatedAt: UserLegalRepresentorCreatedAt;
  userLegalRepresentorUpdatedAt: UserLegalRepresentorUpdatedAt;
  userId: UserId;
  userDocument: UserDocument;
  addressZipCode: AddressZipCode;
  addressStreet: AddressStreet;
  addressNumber: AddressNumber;
  addressNeighborhood: AddressNeighborhood;
  addressCity: AddressCity;
  addressFederativeUnit: AddressFederativeUnit;
  addressCountry?: AddressCountry;
  addressComplement?: AddressComplement;
};

type ReportUserLegalRepresentorCreationAttributes =
  ReportUserLegalRepresentorAttributes;

@Table({
  tableName: 'report_users_legal_representor',
  timestamps: true,
  underscored: true,
})
export class ReportUserLegalRepresentorModel
  extends DatabaseModel<
    ReportUserLegalRepresentorAttributes,
    ReportUserLegalRepresentorCreationAttributes
  >
  implements ReportUserLegalRepresentor
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userLegalRepresentorId: UserLegalRepresentorId;

  @AllowNull(false)
  @Column(DataType.STRING)
  personType: PersonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  document: Document;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: Name;

  @AllowNull(false)
  @Column(DataType.DATE)
  birthDate: BirthDate;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: Type;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isPublicServer: IsPublicServer;

  @AllowNull(false)
  @Column(DataType.DATE)
  userLegalRepresentorCreatedAt: UserLegalRepresentorCreatedAt;

  @AllowNull(false)
  @Column(DataType.DATE)
  userLegalRepresentorUpdatedAt: UserLegalRepresentorUpdatedAt;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId: UserId;

  @AllowNull(false)
  @Column(DataType.STRING)
  userDocument: UserDocument;

  @AllowNull(false)
  @Column(DataType.STRING)
  addressZipCode: AddressZipCode;

  @AllowNull(false)
  @Column(DataType.STRING)
  addressStreet: AddressStreet;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  addressNumber: AddressNumber;

  @AllowNull(false)
  @Column(DataType.STRING)
  addressNeighborhood: AddressNeighborhood;

  @AllowNull(false)
  @Column(DataType.STRING)
  addressCity: AddressCity;

  @AllowNull(false)
  @Column(DataType.STRING)
  addressFederativeUnit: AddressFederativeUnit;

  @Column(DataType.STRING)
  addressCountry?: AddressCountry;

  @Column(DataType.STRING)
  addressComplement?: AddressComplement;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  userLegalRepresentor: UserLegalRepresentor;

  constructor(
    values?: ReportUserLegalRepresentorAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userLegalRepresentorId =
      values?.userLegalRepresentorId ?? values?.userLegalRepresentor?.id;
    this.personType =
      values?.personType ?? values?.userLegalRepresentor?.personType;
    this.document = values?.document ?? values?.userLegalRepresentor?.document;
    this.name = values?.name ?? values?.userLegalRepresentor?.name;
    this.birthDate =
      values?.birthDate ?? values?.userLegalRepresentor?.birthDate;
    this.type = values?.type ?? values?.userLegalRepresentor?.type;
    this.isPublicServer =
      values?.isPublicServer ?? values?.userLegalRepresentor?.isPublicServer;
    this.userLegalRepresentorCreatedAt =
      values?.userLegalRepresentorCreatedAt ??
      values?.userLegalRepresentor?.createdAt;
    this.userLegalRepresentorUpdatedAt =
      values?.userLegalRepresentorUpdatedAt ??
      values?.userLegalRepresentor?.updatedAt;
    this.userId = values?.userId ?? values?.userLegalRepresentor?.user?.uuid;
    this.userDocument =
      values?.userDocument ?? values?.userLegalRepresentor?.user?.document;
    this.addressZipCode =
      values?.addressZipCode ?? values?.userLegalRepresentor?.address?.zipCode;
    this.addressStreet =
      values?.addressStreet ?? values?.userLegalRepresentor?.address?.street;
    this.addressNumber =
      values?.addressNumber ?? values?.userLegalRepresentor?.address?.number;
    this.addressNeighborhood =
      values?.addressNeighborhood ??
      values?.userLegalRepresentor?.address?.neighborhood;
    this.addressCity =
      values?.addressCity ?? values?.userLegalRepresentor?.address?.city;
    this.addressFederativeUnit =
      values?.addressFederativeUnit ??
      values?.userLegalRepresentor?.address?.federativeUnit;
    this.addressCountry =
      values?.addressCountry ?? values?.userLegalRepresentor?.address?.country;
    this.addressComplement =
      values?.addressComplement ??
      values?.userLegalRepresentor?.address?.complement;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): ReportUserLegalRepresentor {
    const entity = new ReportUserLegalRepresentorEntity(
      this.get({ plain: true }),
    );

    const user = new UserEntity({
      uuid: this.userId,
      document: this.userDocument,
    });

    const address = new AddressLegalRepresentorEntity({
      zipCode: this.addressZipCode,
      street: this.addressStreet,
      number: this.addressNumber,
      neighborhood: this.addressNeighborhood,
      city: this.addressCity,
      federativeUnit: this.addressFederativeUnit,
      ...(this.addressCountry && {
        country: this.addressCountry,
      }),
      ...(this.addressComplement && {
        complement: this.addressComplement,
      }),
    });

    entity.userLegalRepresentor = new UserLegalRepresentorEntity({
      id: this.userLegalRepresentorId,
      user,
      address,
      personType: this.personType,
      document: this.document,
      name: this.name,
      birthDate: this.birthDate,
      type: this.type,
      isPublicServer: this.isPublicServer,
      createdAt: this.userLegalRepresentorCreatedAt,
      updatedAt: this.userLegalRepresentorUpdatedAt,
    });

    Reflect.deleteProperty(entity, 'userId');
    Reflect.deleteProperty(entity, 'userDocument');

    Reflect.deleteProperty(entity, 'addressZipCode');
    Reflect.deleteProperty(entity, 'addressStreet');
    Reflect.deleteProperty(entity, 'addressNumber');
    Reflect.deleteProperty(entity, 'addressNeighborhood');
    Reflect.deleteProperty(entity, 'addressCity');
    Reflect.deleteProperty(entity, 'addressFederativeUnit');
    Reflect.deleteProperty(entity, 'addressCountry');
    Reflect.deleteProperty(entity, 'addressComplement');

    Reflect.deleteProperty(entity, 'personType');
    Reflect.deleteProperty(entity, 'document');
    Reflect.deleteProperty(entity, 'name');
    Reflect.deleteProperty(entity, 'birthDate');
    Reflect.deleteProperty(entity, 'type');
    Reflect.deleteProperty(entity, 'isPublicServer');
    Reflect.deleteProperty(entity, 'userLegalRepresentorCreatedAt');
    Reflect.deleteProperty(entity, 'userLegalRepresentorUpdatedAt');

    return entity;
  }
}
