import { Logger } from 'winston';
import {
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestRepository,
} from '@zro/compliance/domain';
import { AutoValidator } from '@zro/common';
import { IsUUID } from 'class-validator';
import {
  HandleUserWithdrawSettingRequestPendingUseCase,
  OperationService,
  UserService,
  UserWithdrawSettingRequestGateway,
} from '@zro/compliance/application';
import {
  UserWithdrawSettingRequestEventEmitterController,
  UserWithdrawSettingRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';

type THandleUserWithdrawSettingRequestPendingRequest = Pick<
  UserWithdrawSettingRequest,
  'id'
>;

export class HandleUserWithdrawSettingRequestPendingRequest
  extends AutoValidator
  implements THandleUserWithdrawSettingRequestPendingRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: THandleUserWithdrawSettingRequestPendingRequest) {
    super(props);
  }
}

export class HandleUserWithdrawSettingRequestPendingController {
  private usecase: HandleUserWithdrawSettingRequestPendingUseCase;

  constructor(
    private logger: Logger,
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    userWithdrawSettingRequestGateway: UserWithdrawSettingRequestGateway,
    eventEmitter: UserWithdrawSettingRequestEventEmitterControllerInterface,
    userService: UserService,
    operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: HandleUserWithdrawSettingRequestPendingController.name,
    });

    const controllerUserWithdrawSettingRequestEventEmitter =
      new UserWithdrawSettingRequestEventEmitterController(eventEmitter);

    this.usecase = new HandleUserWithdrawSettingRequestPendingUseCase(
      this.logger,
      userWithdrawSettingRequestRepository,
      userWithdrawSettingRequestGateway,
      controllerUserWithdrawSettingRequestEventEmitter,
      userService,
      operationService,
    );
  }

  async execute(
    request: HandleUserWithdrawSettingRequestPendingRequest,
  ): Promise<void> {
    this.logger.debug('Handle user withdraw setting request pending request.', {
      request,
    });

    const userWithdrawSettingRequest = new UserWithdrawSettingRequestEntity({
      id: request.id,
    });

    await this.usecase.execute(userWithdrawSettingRequest);
  }
}
