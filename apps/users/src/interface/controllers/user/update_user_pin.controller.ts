import { Logger } from 'winston';
import { IsString, IsUUID, MaxLength } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  User,
  UserForgotPasswordRepository,
  UserRepository,
} from '@zro/users/domain';
import { UpdateUserPinUseCase } from '@zro/users/application';
import {
  UserEventEmitterController,
  UserEventEmitterControllerInterface,
} from '@zro/users/interface';

interface TUpdateUserPinRequest {
  uuid: User['uuid'];
  newPin: User['pin'];
}

export class UpdateUserPinRequest
  extends AutoValidator
  implements TUpdateUserPinRequest
{
  @IsUUID(4)
  uuid: string;

  @IsString()
  @MaxLength(255)
  newPin: string;

  constructor(props: TUpdateUserPinRequest) {
    super(props);
  }
}

interface TUpdateUserPinResponse {
  uuid: User['uuid'];
}

export class UpdateUserPinResponse
  extends AutoValidator
  implements TUpdateUserPinResponse
{
  @IsUUID(4)
  uuid: string;

  constructor(props: TUpdateUserPinResponse) {
    super(props);
  }
}

export class UpdateUserPinController {
  private usecase: UpdateUserPinUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    userForgotPassword: UserForgotPasswordRepository,
    serviceEventEmitter: UserEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({ context: UpdateUserPinController.name });

    const eventEmitter = new UserEventEmitterController(serviceEventEmitter);

    this.usecase = new UpdateUserPinUseCase(
      logger,
      userRepository,
      userForgotPassword,
      eventEmitter,
    );
  }

  async execute(request: UpdateUserPinRequest): Promise<UpdateUserPinResponse> {
    this.logger.debug('Updating user pin request.', { request });

    const { uuid, newPin } = request;

    const user = await this.usecase.execute(uuid, newPin);

    if (!user) return null;

    const response = new UpdateUserPinResponse({
      uuid: user.uuid,
    });

    return response;
  }
}
