import { Logger } from 'winston';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Length,
  IsEmail,
} from 'class-validator';
import { AutoValidator, IsMobilePhone } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';
import { CreateUserUseCase, HashProvider } from '@zro/users/application';
import {
  UserEventEmitterController,
  UserEventEmitterControllerInterface,
} from '@zro/users/interface';

type TCreateUserRequest = Pick<
  User,
  'name' | 'phoneNumber' | 'referralCode' | 'password' | 'email'
> & { id: User['uuid']; confirmCode: string };

export class CreateUserRequest
  extends AutoValidator
  implements TCreateUserRequest
{
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsMobilePhone()
  @MaxLength(15)
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @Length(5, 5)
  confirmCode: string;

  @IsOptional()
  referralCode: string;

  @IsEmail()
  email: string;

  constructor(props: TCreateUserRequest) {
    super(props);
  }
}

type TCreateUserResponse = { id: Pick<User, 'uuid'>['uuid'] };

export class CreateUserResponse
  extends AutoValidator
  implements TCreateUserResponse
{
  @IsUUID(4)
  id: string;

  constructor(props: TCreateUserResponse) {
    super(props);
  }
}

export class CreateUserController {
  private usecase: CreateUserUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    serviceEventEmitter: UserEventEmitterControllerInterface,
    hashProvider: HashProvider,
  ) {
    this.logger = logger.child({
      context: CreateUserController.name,
    });
    const eventEmitter = new UserEventEmitterController(serviceEventEmitter);
    this.usecase = new CreateUserUseCase(
      this.logger,
      userRepository,
      hashProvider,
      eventEmitter,
    );
  }

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    this.logger.debug('Create user request.', { request });

    const {
      name,
      phoneNumber,
      referralCode,
      id,
      password,
      confirmCode,
      email,
    } = request;

    const createdUser = await this.usecase.execute(
      id,
      name,
      phoneNumber.replace(/\D/g, ''),
      password,
      confirmCode,
      email,
      referralCode,
    );

    const response = new CreateUserResponse({ id: createdUser.uuid });

    this.logger.info('Create user response.', { user: response });

    return response;
  }
}
