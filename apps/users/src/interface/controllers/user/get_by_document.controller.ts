import { Logger } from 'winston';
import {
  IsUUID,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsDefined,
  IsPositive,
  IsString,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { AutoValidator, IsCpfOrCnpj } from '@zro/common';
import { User, PersonType, UserRepository } from '@zro/users/domain';
import { GetUserByDocumentUseCase } from '@zro/users/application';

type TGetUserByDocumentRequest = Pick<User, 'document'>;

export class GetUserByDocumentRequest
  extends AutoValidator
  implements TGetUserByDocumentRequest
{
  @IsCpfOrCnpj()
  document: string;

  constructor(props: TGetUserByDocumentRequest) {
    super(props);
  }
}

type TGetUserByDocumentResponse = Pick<
  User,
  | 'id'
  | 'uuid'
  | 'document'
  | 'type'
  | 'fullName'
  | 'phoneNumber'
  | 'pin'
  | 'pinHasCreated'
  | 'active'
  | 'password'
  | 'email'
>;

export class GetUserByDocumentResponse
  extends AutoValidator
  implements TGetUserByDocumentResponse
{
  @IsPositive()
  id: number;

  @IsUUID(4)
  uuid: string;

  @IsCpfOrCnpj()
  document: string;

  @IsEnum(PersonType)
  type: PersonType;

  @IsOptional()
  @IsNotEmpty()
  fullName?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  phoneNumber: string;

  @IsNotEmpty()
  pin: string;

  @IsDefined()
  pinHasCreated: boolean;

  @IsBoolean()
  active: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  password: string;

  @IsString()
  @IsOptional()
  email?: string;

  constructor(props: TGetUserByDocumentResponse) {
    super(props);
  }
}

export class GetUserByDocumentController {
  private usecase: GetUserByDocumentUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: GetUserByDocumentController.name });
    this.usecase = new GetUserByDocumentUseCase(this.logger, userRepository);
  }

  async execute(
    request: GetUserByDocumentRequest,
  ): Promise<GetUserByDocumentResponse> {
    this.logger.debug('Getting user request.', { request });

    const user = await this.usecase.execute(request.document);

    if (!user) return null;

    const response = new GetUserByDocumentResponse({
      id: user.id,
      uuid: user.uuid,
      document: user.document,
      type: user.type,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      pin: user.pin,
      pinHasCreated: user.pinHasCreated,
      active: user.active,
      password: user.password,
      email: user.email,
    });

    return response;
  }
}
