import { Logger } from 'winston';
import { IsString, IsUUID, MaxLength } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';
import { AddUserPinUseCase } from '@zro/users/application';
import {
  UserEventEmitterController,
  UserEventEmitterControllerInterface,
} from '@zro/users/interface';

interface TAddUserPinRequest {
  uuid: User['uuid'];
  pin: User['pin'];
}

export class AddUserPinRequest
  extends AutoValidator
  implements TAddUserPinRequest
{
  @IsUUID(4)
  uuid: string;

  @IsString()
  @MaxLength(255)
  pin: string;

  constructor(props: TAddUserPinRequest) {
    super(props);
  }
}

interface TAddUserPinResponse {
  uuid: User['uuid'];
}

export class AddUserPinResponse
  extends AutoValidator
  implements TAddUserPinResponse
{
  @IsUUID(4)
  uuid: string;

  constructor(props: TAddUserPinResponse) {
    super(props);
  }
}

export class AddUserPinController {
  private usecase: AddUserPinUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    serviceEventEmitter: UserEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({ context: AddUserPinController.name });

    const eventEmitter = new UserEventEmitterController(serviceEventEmitter);

    this.usecase = new AddUserPinUseCase(logger, userRepository, eventEmitter);
  }

  async execute(request: AddUserPinRequest): Promise<AddUserPinResponse> {
    this.logger.debug('Add user pin request.', { request });

    const { uuid, pin } = request;

    const user = await this.usecase.execute(uuid, pin);

    if (!user) return null;

    const response = new AddUserPinResponse({ uuid: user.uuid });

    return response;
  }
}
