import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  UserEntity,
  UserForgotPassword,
  UserForgotPasswordRepository,
} from '@zro/users/domain';
import { DeclineUserForgotPasswordUseCase as UseCase } from '@zro/users/application';
import {
  UserForgotPasswordEventEmitterController,
  UserForgotPasswordEventEmitterControllerInterface,
} from '@zro/users/interface';

type TDeclineUserForgotPasswordRequest = Pick<UserForgotPassword, 'id'> & {
  userId: string;
};

export class DeclineUserForgotPasswordRequest
  extends AutoValidator
  implements TDeclineUserForgotPasswordRequest
{
  @IsUUID()
  id: string;

  @IsUUID()
  userId: string;

  constructor(props: TDeclineUserForgotPasswordRequest) {
    super(props);
  }
}

export class DeclineUserForgotPasswordController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userForgotPasswordRepository: UserForgotPasswordRepository,
    serviceEventEmitter: UserForgotPasswordEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: DeclineUserForgotPasswordController.name,
    });

    const eventEmitter = new UserForgotPasswordEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      userForgotPasswordRepository,
      eventEmitter,
    );
  }

  async execute(request: DeclineUserForgotPasswordRequest): Promise<void> {
    this.logger.debug('Decline user forgot password request.', { request });

    const { id, userId } = request;

    const user = new UserEntity({ uuid: userId });

    await this.usecase.execute(id, user);
  }
}
