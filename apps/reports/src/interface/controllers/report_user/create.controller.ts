import { Logger } from 'winston';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsCpfOrCnpj, IsIsoStringDateFormat } from '@zro/common';
import {
  Address,
  AddressEntity,
  Occupation,
  OccupationEntity,
  Onboarding,
  OnboardingEntity,
  PersonType,
  User,
  UserEntity,
  UserLegalAdditionalInfo,
  UserLegalAdditionalInfoEntity,
  UserState,
} from '@zro/users/domain';
import { ReportUser, ReportUserRepository } from '@zro/reports/domain';
import {
  AdminService,
  OperationService,
  CreateReportUserUseCase as UseCase,
} from '@zro/reports/application';

type UserId = User['uuid'];
type FullName = User['fullName'];
type PhoneNumber = User['phoneNumber'];
type Document = User['document'];
type UserDeletedAt = User['deletedAt'];
type UserUpdatedAt = User['updatedAt'];
type Email = User['email'];
type Type = User['type'];
type MotherName = User['motherName'];
type BirthDate = User['birthDate'];
type Genre = User['genre'];

type AddressStreet = Address['street'];
type AddressNumber = Address['number'];
type AddressCity = Address['city'];
type AddressFederativeUnit = Address['federativeUnit'];
type AddressCountry = Address['country'];
type AddressZipCode = Address['zipCode'];
type AddressComplement = Address['complement'];

type OnboardingUpdatedAt = Onboarding['updatedAt'];
type OnboardingReviewAssignee = Onboarding['reviewAssignee'];
type OnboardingPepSince = Onboarding['pepSince'];

type OccupationName = Occupation['name'];

type Cnae = UserLegalAdditionalInfo['cnae'];
type ConstitutionDesc = UserLegalAdditionalInfo['constitutionDesc'];
type EmployeeQty = UserLegalAdditionalInfo['employeeQty'];
type OverseasBranchesQty = UserLegalAdditionalInfo['overseasBranchesQty'];
type isThirdPartyRelationship =
  UserLegalAdditionalInfo['isThirdPartyRelationship'];
type IsCreditCardAdmin = UserLegalAdditionalInfo['isCreditCardAdmin'];
type isPatrimonyTrust = UserLegalAdditionalInfo['isPatrimonyTrust'];
type IsPaymentFacilitator = UserLegalAdditionalInfo['isPaymentFacilitator'];
type IsRegulatedPld = UserLegalAdditionalInfo['isRegulatedPld'];
type LegalNaturityCode = UserLegalAdditionalInfo['legalNaturityCode'];

type TCreateReportUserRequest = Pick<ReportUser, 'id'> & {
  userId: UserId;
  fullName?: FullName;
  phoneNumber: PhoneNumber;
  document: Document;
  userDeletedAt?: UserDeletedAt;
  userUpdatedAt: UserUpdatedAt;
  state: UserState;
  email?: Email;
  type: Type;
  motherName?: MotherName;
  birthDate?: BirthDate;
  genre?: Genre;
  addressStreet?: AddressStreet;
  addressNumber?: AddressNumber;
  addressCity: AddressCity;
  addressFederativeUnit: AddressFederativeUnit;
  addressCountry?: AddressCountry;
  addressZipCode?: AddressZipCode;
  onboardingUpdatedAt: OnboardingUpdatedAt;
  onboardingReviewAssignee?: OnboardingReviewAssignee;
  onboardingPepSince?: OnboardingPepSince;
  occupationName?: OccupationName;
  cnae?: Cnae;
  constitutionDesc?: ConstitutionDesc;
  employeeQty?: EmployeeQty;
  overseasBranchesQty?: OverseasBranchesQty;
  isThirdPartyRelationship?: isThirdPartyRelationship;
  isCreditCardAdmin?: IsCreditCardAdmin;
  isPatrimonyTrust?: isPatrimonyTrust;
  isPaymentFacilitator?: IsPaymentFacilitator;
  isRegulatedPld?: IsRegulatedPld;
  legalNaturityCode?: LegalNaturityCode;
};

export class CreateReportUserRequest
  extends AutoValidator
  implements TCreateReportUserRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: FullName;

  @IsString()
  @MaxLength(255)
  phoneNumber: PhoneNumber;

  @IsCpfOrCnpj()
  document: Document;

  @IsOptional()
  userDeletedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format userUpdatedAt',
  })
  userUpdatedAt: Date;

  @IsEnum(UserState)
  state: UserState;

  @IsOptional()
  @IsEmail()
  email: Email;

  @IsEnum(PersonType)
  type: PersonType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  motherName?: MotherName;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format birthDate',
  })
  birthDate?: BirthDate;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  genre?: Genre;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressStreet?: AddressStreet;

  @IsOptional()
  @IsNumber()
  addressNumber?: AddressNumber;

  @IsString()
  @MaxLength(255)
  addressCity: AddressCity;

  @IsString()
  @MaxLength(255)
  addressFederativeUnit: AddressFederativeUnit;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressCountry?: AddressCountry;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressZipCode?: AddressZipCode;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressComplement?: AddressComplement;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format onboardingUpdatedAt',
  })
  onboardingUpdatedAt: OnboardingUpdatedAt;

  @IsOptional()
  @IsInt()
  onboardingReviewAssignee?: OnboardingReviewAssignee;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  onboardingPepSince?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  occupationName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  cnae?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  constitutionDesc?: string;

  @IsOptional()
  @IsNumber()
  employeeQty?: number;

  @IsOptional()
  @IsNumber()
  overseasBranchesQty?: number;

  @IsOptional()
  @IsBoolean()
  isThirdPartyRelationship?: boolean;

  @IsOptional()
  @IsBoolean()
  isCreditCardAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  isPatrimonyTrust?: boolean;

  @IsOptional()
  @IsBoolean()
  isPaymentFacilitator?: boolean;

  @IsOptional()
  @IsBoolean()
  isRegulatedPld?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  legalNaturityCode?: string;

  constructor(props: CreateReportUserRequest) {
    super(props);
  }
}

type TCreateReportUserResponse = Omit<
  ReportUser,
  'user' | 'address' | 'onboarding' | 'admin' | 'userLimit' | 'updatedAt'
> & {
  userId: UserId;
};

export class CreateReportUserResponse
  extends AutoValidator
  implements TCreateReportUserResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreateReportUserResponse) {
    super(props);
  }
}

export class CreateReportUserController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    reportUserRepository: ReportUserRepository,
    adminService: AdminService,
    operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: CreateReportUserController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      reportUserRepository,
      adminService,
      operationService,
    );
  }

  async execute(
    request: CreateReportUserRequest,
  ): Promise<CreateReportUserResponse> {
    this.logger.debug('Create Report user request.', { request });

    const user = new UserEntity({
      uuid: request.userId,
      fullName: request.fullName,
      phoneNumber: request.phoneNumber,
      document: request.document,
      deletedAt: request.userDeletedAt,
      updatedAt: request.userUpdatedAt,
      state: request.state,
      email: request.email,
      type: request.type,
      motherName: request.motherName,
      birthDate: request.birthDate,
      genre: request.genre,
    });

    const address = new AddressEntity({
      street: request.addressStreet,
      number: request.addressNumber,
      city: request.addressCity,
      federativeUnit: request.addressFederativeUnit,
      country: request.addressCountry,
      zipCode: request.addressZipCode,
      complement: request.addressComplement,
    });

    const onboarding = new OnboardingEntity({
      updatedAt: request.onboardingUpdatedAt,
      reviewAssignee: request.onboardingReviewAssignee,
      pepSince: request.onboardingPepSince,
    });

    const occupation =
      request.occupationName &&
      new OccupationEntity({
        name: request.occupationName,
      });

    const userLegalAdditionalInfo = new UserLegalAdditionalInfoEntity({
      cnae: request.cnae,
      constitutionDesc: request.constitutionDesc,
      employeeQty: request.employeeQty,
      overseasBranchesQty: request.overseasBranchesQty,
      isThirdPartyRelationship: request.isThirdPartyRelationship,
      isCreditCardAdmin: request.isCreditCardAdmin,
      isPatrimonyTrust: request.isPatrimonyTrust,
      isPaymentFacilitator: request.isPaymentFacilitator,
      isRegulatedPld: request.isRegulatedPld,
      legalNaturityCode: request.legalNaturityCode,
    });

    const result = await this.usecase.execute(
      request.id,
      user,
      address,
      onboarding,
      occupation,
      userLegalAdditionalInfo,
    );

    const response = new CreateReportUserResponse({
      id: result.id,
      userId: result.user.uuid,
      createdAt: result.createdAt,
    });

    this.logger.debug('Create Report user response.', {
      response,
    });

    return response;
  }
}
