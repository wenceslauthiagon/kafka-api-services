import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  AutoValidator,
  IsCpfOrCnpj,
  IsCnpj,
  IsIsoStringDateFormat,
} from '@zro/common';
import {
  AddressLegalRepresentorEntity,
  PersonType,
  RepresentorType,
  UserEntity,
  UserLegalRepresentor,
  UserLegalRepresentorEntity,
} from '@zro/users/domain';
import {
  ReportUserLegalRepresentor,
  ReportUserLegalRepresentorRepository,
} from '@zro/reports/domain';
import { CreateReportUserLegalRepresentorUseCase as UseCase } from '@zro/reports/application';

type UserLegalRepresentorId = UserLegalRepresentor['id'];
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

type TCreateReportUserLegalRepresentorRequest = Pick<
  ReportUserLegalRepresentor,
  'id'
> & {
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

export class CreateReportUserLegalRepresentorRequest
  extends AutoValidator
  implements TCreateReportUserLegalRepresentorRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userLegalRepresentorId: UserLegalRepresentorId;

  @IsEnum(PersonType)
  personType: PersonType;

  @IsCpfOrCnpj()
  document: Document;

  @IsString()
  @MaxLength(255)
  name: Name;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format BirthDate',
  })
  birthDate: BirthDate;

  @IsEnum(RepresentorType)
  type: Type;

  @IsBoolean()
  isPublicServer: IsPublicServer;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format userLegalRepresentorCreatedAt',
  })
  userLegalRepresentorCreatedAt: UserLegalRepresentorCreatedAt;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format userLegalRepresentorUpdatedAt',
  })
  userLegalRepresentorUpdatedAt: UserLegalRepresentorUpdatedAt;

  @IsUUID(4)
  userId: UserId;

  @IsCnpj()
  userDocument: UserDocument;

  @IsString()
  @MaxLength(255)
  addressZipCode: AddressZipCode;

  @IsString()
  @MaxLength(255)
  addressStreet: AddressStreet;

  @IsNumber()
  addressNumber: AddressNumber;

  @IsString()
  @MaxLength(255)
  addressNeighborhood: AddressNeighborhood;

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
  addressComplement?: AddressComplement;

  constructor(props: CreateReportUserLegalRepresentorRequest) {
    super(props);
  }
}

type TCreateReportUserLegalRepresentorResponse = Pick<
  ReportUserLegalRepresentor,
  'id' | 'createdAt'
> & {
  userLegalRepresentorId: UserLegalRepresentorId;
};

export class CreateReportUserLegalRepresentorResponse
  extends AutoValidator
  implements TCreateReportUserLegalRepresentorResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userLegalRepresentorId: UserLegalRepresentorId;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreateReportUserLegalRepresentorResponse) {
    super(props);
  }
}

export class CreateReportUserLegalRepresentorController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    reportUserLegalRepresentorRepository: ReportUserLegalRepresentorRepository,
  ) {
    this.logger = logger.child({
      context: CreateReportUserLegalRepresentorController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      reportUserLegalRepresentorRepository,
    );
  }

  async execute(
    request: CreateReportUserLegalRepresentorRequest,
  ): Promise<CreateReportUserLegalRepresentorResponse> {
    this.logger.debug('Create Report UserLegalRepresentor request.', {
      request,
    });

    const user = new UserEntity({
      uuid: request.userId,
      document: request.document,
    });

    const address = new AddressLegalRepresentorEntity({
      zipCode: request.addressZipCode,
      street: request.addressStreet,
      number: request.addressNumber,
      neighborhood: request.addressNeighborhood,
      city: request.addressCity,
      federativeUnit: request.addressFederativeUnit,
      ...(request.addressCountry && {
        country: request.addressCountry,
      }),
      ...(request.addressComplement && {
        complement: request.addressComplement,
      }),
    });

    const userLegalRepresentor = new UserLegalRepresentorEntity({
      id: request.userLegalRepresentorId,
      user,
      address,
      personType: request.personType,
      document: request.document,
      name: request.name,
      birthDate: request.birthDate,
      type: request.type,
      isPublicServer: request.isPublicServer,
      createdAt: request.userLegalRepresentorCreatedAt,
      updatedAt: request.userLegalRepresentorUpdatedAt,
    });

    const result = await this.usecase.execute(request.id, userLegalRepresentor);

    const response = new CreateReportUserLegalRepresentorResponse({
      id: result.id,
      userLegalRepresentorId: result.userLegalRepresentor.id,
      createdAt: result.createdAt,
    });

    this.logger.debug('Create Report UserLegalRepresentor response.', {
      response,
    });

    return response;
  }
}
