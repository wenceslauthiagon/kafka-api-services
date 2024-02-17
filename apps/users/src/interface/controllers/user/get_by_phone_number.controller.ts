import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { PersonType, User, UserRepository } from '@zro/users/domain';
import { GetUserByPhoneNumberUseCase } from '@zro/users/application';

type TGetUserByPhoneNumberRequest = Pick<User, 'phoneNumber'>;

export class GetUserByPhoneNumberRequest
  extends AutoValidator
  implements TGetUserByPhoneNumberRequest
{
  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  phoneNumber: string;

  constructor(props: TGetUserByPhoneNumberRequest) {
    super(props);
  }
}

type TGetUserByPhoneNumberResponse = Pick<
  User,
  | 'id'
  | 'uuid'
  | 'password'
  | 'pin'
  | 'pinHasCreated'
  | 'phoneNumber'
  | 'email'
  | 'type'
  | 'active'
>;

export class GetUserByPhoneNumberResponse
  extends AutoValidator
  implements TGetUserByPhoneNumberResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsUUID(4)
  uuid: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  pin: string;

  @IsBoolean()
  pinHasCreated: boolean;

  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  phoneNumber: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsEnum(PersonType)
  type: PersonType;

  @IsBoolean()
  active: boolean;

  constructor(props: TGetUserByPhoneNumberResponse) {
    super(props);
  }
}

export class GetUserByPhoneNumberController {
  private usecase: GetUserByPhoneNumberUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
  ) {
    this.logger = logger.child({
      context: GetUserByPhoneNumberController.name,
    });
    this.usecase = new GetUserByPhoneNumberUseCase(this.logger, userRepository);
  }

  async execute(
    request: GetUserByPhoneNumberRequest,
  ): Promise<GetUserByPhoneNumberResponse> {
    this.logger.debug('Getting user request.', { request });

    const { phoneNumber } = request;

    const user = await this.usecase.execute(phoneNumber);

    if (!user) return null;

    const response = new GetUserByPhoneNumberResponse({
      id: user.id,
      uuid: user.uuid,
      password: user.password,
      pin: user.pin,
      pinHasCreated: user.pinHasCreated,
      phoneNumber: user.phoneNumber,
      email: user.email,
      active: user.active,
      type: user.type,
    });

    return response;
  }
}
