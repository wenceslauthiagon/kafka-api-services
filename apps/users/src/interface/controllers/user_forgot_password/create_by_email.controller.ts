import { Logger } from 'winston';
import { IsEmail, IsUUID } from 'class-validator';
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
  CreateUserForgotPasswordByEmailUseCase,
  NotificationService,
} from '@zro/users/application';
import {
  UserForgotPasswordEventEmitterController,
  UserForgotPasswordEventEmitterControllerInterface,
} from '@zro/users/interface';

type TCreateUserForgotPasswordByEmailRequest = Pick<User, 'email'> & {
  id: UserForgotPasswordId;
};

export class CreateUserForgotPasswordByEmailRequest
  extends AutoValidator
  implements TCreateUserForgotPasswordByEmailRequest
{
  @IsUUID()
  id: string;

  @IsEmail()
  email: string;

  constructor(props: TCreateUserForgotPasswordByEmailRequest) {
    super(props);
  }
}

type TCreateUserForgotPasswordByEmailResponse = Pick<UserForgotPassword, 'id'>;

export class CreateUserForgotPasswordByEmailResponse
  extends AutoValidator
  implements TCreateUserForgotPasswordByEmailResponse
{
  @IsUUID(4)
  id: string;

  constructor(props: TCreateUserForgotPasswordByEmailResponse) {
    super(props);
  }
}

export class CreateUserForgotPasswordByEmailController {
  private usecase: CreateUserForgotPasswordByEmailUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    userForgotPasswordRepository: UserForgotPasswordRepository,
    serviceEventEmitter: UserForgotPasswordEventEmitterControllerInterface,
    notificationService: NotificationService,
    emailTag: string,
    emailFrom: string,
  ) {
    this.logger = logger.child({
      context: CreateUserForgotPasswordByEmailController.name,
    });

    const eventEmitter = new UserForgotPasswordEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new CreateUserForgotPasswordByEmailUseCase(
      this.logger,
      userRepository,
      userForgotPasswordRepository,
      eventEmitter,
      notificationService,
      emailTag,
      emailFrom,
    );
  }

  async execute(
    request: CreateUserForgotPasswordByEmailRequest,
  ): Promise<CreateUserForgotPasswordByEmailResponse> {
    this.logger.debug('Create user forgot password request.', { request });

    const { id, email } = request;

    const user = new UserEntity({ email });

    const createdUserForgotPassword = await this.usecase.execute(user, id);

    if (!createdUserForgotPassword) return null;

    const response = new CreateUserForgotPasswordByEmailResponse({
      id: createdUserForgotPassword.id,
    });

    this.logger.info('Create user forgot password response.', {
      userForgotPassword: response,
    });

    return response;
  }
}
