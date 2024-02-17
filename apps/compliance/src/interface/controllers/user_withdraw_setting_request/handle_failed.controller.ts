import { Logger } from 'winston';
import {
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestRepository,
} from '@zro/compliance/domain';
import { AutoValidator } from '@zro/common';
import { IsUUID } from 'class-validator';
import { HandleUserWithdrawSettingRequestFailedUseCase } from '@zro/compliance/application';
import {
  UserWithdrawSettingRequestEventEmitterController,
  UserWithdrawSettingRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';

type THandleUserWithdrawSettingRequestFailedRequest = Pick<
  UserWithdrawSettingRequest,
  'id'
>;

export class HandleUserWithdrawSettingRequestFailedRequest
  extends AutoValidator
  implements THandleUserWithdrawSettingRequestFailedRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: THandleUserWithdrawSettingRequestFailedRequest) {
    super(props);
  }
}

export class HandleUserWithdrawSettingRequestFailedController {
  private usecase: HandleUserWithdrawSettingRequestFailedUseCase;

  constructor(
    private logger: Logger,
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    eventEmitter: UserWithdrawSettingRequestEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleUserWithdrawSettingRequestFailedController.name,
    });

    const controllerUserWithdrawSettingRequestEventEmitter =
      new UserWithdrawSettingRequestEventEmitterController(eventEmitter);

    this.usecase = new HandleUserWithdrawSettingRequestFailedUseCase(
      this.logger,
      userWithdrawSettingRequestRepository,
      controllerUserWithdrawSettingRequestEventEmitter,
    );
  }

  async execute(
    request: HandleUserWithdrawSettingRequestFailedRequest,
  ): Promise<void> {
    this.logger.debug('Handle user withdraw setting request failed request.', {
      request,
    });

    const userWithdrawSettingRequest = new UserWithdrawSettingRequestEntity({
      id: request.id,
    });

    await this.usecase.execute(userWithdrawSettingRequest);
  }
}
