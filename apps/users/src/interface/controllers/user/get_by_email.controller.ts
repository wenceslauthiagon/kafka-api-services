import { Logger } from 'winston';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';
import { GetUserByEmailUseCase } from '@zro/users/application';

type TGetUserByEmailRequest = Pick<User, 'email'>;

export class GetUserByEmailRequest
  extends AutoValidator
  implements TGetUserByEmailRequest
{
  @IsNotEmpty()
  @IsString()
  email: string;

  constructor(props: TGetUserByEmailRequest) {
    super(props);
  }
}

type TGetUserByEmailResponse = Pick<
  User,
  | 'id'
  | 'uuid'
  | 'password'
  | 'pin'
  | 'pinHasCreated'
  | 'phoneNumber'
  | 'email'
  | 'active'
>;

export class GetUserByEmailResponse
  extends AutoValidator
  implements TGetUserByEmailResponse
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

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsBoolean()
  active: boolean;

  constructor(props: TGetUserByEmailResponse) {
    super(props);
  }
}

export class GetUserByEmailController {
  private usecase: GetUserByEmailUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
  ) {
    this.logger = logger.child({
      context: GetUserByEmailController.name,
    });
    this.usecase = new GetUserByEmailUseCase(this.logger, userRepository);
  }

  async execute(
    request: GetUserByEmailRequest,
  ): Promise<GetUserByEmailResponse> {
    this.logger.debug('Getting user request.', { request });

    const { email } = request;

    const user = await this.usecase.execute(email);

    if (!user) return null;

    const response = new GetUserByEmailResponse({
      id: user.id,
      uuid: user.uuid,
      password: user.password,
      pin: user.pin,
      pinHasCreated: user.pinHasCreated,
      phoneNumber: user.phoneNumber,
      email: user.email,
      active: user.active,
    });

    return response;
  }
}
