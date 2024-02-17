import { Logger } from 'winston';
import {
  IsBoolean,
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsCpfOrCnpj } from '@zro/common';
import { PersonType, User, UserRepository } from '@zro/users/domain';
import { GetUserByUuidUseCase } from '@zro/users/application';

type TGetUserByUuidRequest = Pick<User, 'uuid'>;

export class GetUserByUuidRequest
  extends AutoValidator
  implements TGetUserByUuidRequest
{
  @IsUUID(4)
  uuid: string;

  constructor(props: TGetUserByUuidRequest) {
    super(props);
  }
}

type TGetUserByUuidResponse = Pick<
  User,
  | 'id'
  | 'uuid'
  | 'password'
  | 'document'
  | 'type'
  | 'fullName'
  | 'phoneNumber'
  | 'name'
  | 'email'
  | 'pin'
  | 'pinHasCreated'
  | 'active'
> & { fcmToken?: User['fcmToken'] };

export class GetUserByUuidResponse
  extends AutoValidator
  implements TGetUserByUuidResponse
{
  @IsPositive()
  id: number;

  @IsUUID(4)
  uuid: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  password: string;

  @IsOptional()
  @IsCpfOrCnpj()
  document?: string;

  @IsEnum(PersonType)
  type: PersonType;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  phoneNumber: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  pin: string;

  @IsDefined()
  pinHasCreated: boolean;

  @IsOptional()
  @IsString()
  fcmToken?: string;

  @IsBoolean()
  active: boolean;

  constructor(props: TGetUserByUuidResponse) {
    super(props);
  }
}

export class GetUserByUuidController {
  private usecase: GetUserByUuidUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: GetUserByUuidController.name });
    this.usecase = new GetUserByUuidUseCase(this.logger, userRepository);
  }

  async execute(request: GetUserByUuidRequest): Promise<GetUserByUuidResponse> {
    this.logger.debug('Getting user request.', { request });

    const { uuid } = request;

    const user = await this.usecase.execute(uuid);

    if (!user) return null;

    const response = new GetUserByUuidResponse({
      id: user.id,
      uuid: user.uuid,
      password: user.password,
      document: user.document,
      type: user.type,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      name: user.name,
      pin: user.pin,
      pinHasCreated: user.pinHasCreated,
      fcmToken: user.fcmToken,
      active: user.active,
    });

    return response;
  }
}
