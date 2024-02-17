import { Logger } from 'winston';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  User,
  UserEntity,
  UserForgotPassword,
  UserForgotPasswordId,
  UserForgotPasswordRepository,
  UserRepository,
} from '@zro/users/domain';
import {
  CreateUserForgotPasswordBySmsUseCase,
  NotificationService,
} from '@zro/users/application';
import {
  UserForgotPasswordEventEmitterController,
  UserForgotPasswordEventEmitterControllerInterface,
} from '@zro/users/interface';

type TCreateUserForgotPasswordBySmsRequest = Pick<User, 'phoneNumber'> & {
  id: UserForgotPasswordId;
};

export class CreateUserForgotPasswordBySmsRequest
  extends AutoValidator
  implements TCreateUserForgotPasswordBySmsRequest
{
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  phoneNumber: string;

  constructor(props: TCreateUserForgotPasswordBySmsRequest) {
    super(props);
  }
}

type TCreateUserForgotPasswordBySmsResponse = Pick<UserForgotPassword, 'id'>;

export class CreateUserForgotPasswordBySmsResponse
  extends AutoValidator
  implements TCreateUserForgotPasswordBySmsResponse
{
  @IsUUID(4)
  id: string;

  constructor(props: TCreateUserForgotPasswordBySmsResponse) {
    super(props);
  }
}

export class CreateUserForgotPasswordBySmsController {
  private usecase: CreateUserForgotPasswordBySmsUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    userForgotPasswordRepository: UserForgotPasswordRepository,
    serviceEventEmitter: UserForgotPasswordEventEmitterControllerInterface,
    notificationService: NotificationService,
    smsTag: string,
  ) {
    this.logger = logger.child({
      context: CreateUserForgotPasswordBySmsController.name,
    });

    const eventEmitter = new UserForgotPasswordEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new CreateUserForgotPasswordBySmsUseCase(
      this.logger,
      userRepository,
      userForgotPasswordRepository,
      eventEmitter,
      notificationService,
      smsTag,
    );
  }

  async execute(
    request: CreateUserForgotPasswordBySmsRequest,
  ): Promise<CreateUserForgotPasswordBySmsResponse> {
    this.logger.debug('Create user forgot password request.', { request });

    const { id, phoneNumber } = request;

    const user = new UserEntity({ phoneNumber });

    const createdUserForgotPassword = await this.usecase.execute(user, id);

    if (!createdUserForgotPassword) return null;

    const response = new CreateUserForgotPasswordBySmsResponse({
      id: createdUserForgotPassword.id,
    });

    this.logger.info('Create user forgot password response.', {
      userForgotPassword: response,
    });

    return response;
  }
}
