import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';
import { UpdateUserPinHasCreatedUseCase } from '@zro/users/application';
import {
  UserEventEmitterController,
  UserEventEmitterControllerInterface,
} from '@zro/users/interface';

interface TUpdateUserPinHasCreatedRequest {
  uuid: User['uuid'];
}

export class UpdateUserPinHasCreatedRequest
  extends AutoValidator
  implements TUpdateUserPinHasCreatedRequest
{
  @IsUUID(4)
  uuid: string;

  constructor(props: TUpdateUserPinHasCreatedRequest) {
    super(props);
  }
}

export class UpdateUserPinHasCreatedController {
  private usecase: UpdateUserPinHasCreatedUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    serviceEventEmitter: UserEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: UpdateUserPinHasCreatedController.name,
    });

    const eventEmitter = new UserEventEmitterController(serviceEventEmitter);

    this.usecase = new UpdateUserPinHasCreatedUseCase(
      logger,
      userRepository,
      eventEmitter,
    );
  }

  async execute(request: UpdateUserPinHasCreatedRequest): Promise<void> {
    this.logger.debug('Updating user pin has created request.', { request });

    const { uuid } = request;

    await this.usecase.execute(uuid);
  }
}
