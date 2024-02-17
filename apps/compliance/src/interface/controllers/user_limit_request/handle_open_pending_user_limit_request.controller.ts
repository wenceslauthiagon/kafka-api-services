import { Logger } from 'winston';
import {
  UserLimitRequestEntity,
  UserLimitRequestRepository,
} from '@zro/compliance/domain';
import {
  HandleOpenPendingUserLimitRequestUseCase,
  UserLimitRequestGateway,
  UserService,
} from '@zro/compliance/application';
import {
  UserLimitRequestControllerEvent,
  UserLimitRequestEventEmitterController,
  UserLimitRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';

export type HandleOpenPendingUserLimitRequest = UserLimitRequestControllerEvent;

export class HandleOpenPendingUserLimitRequestController {
  private usecase: HandleOpenPendingUserLimitRequestUseCase;

  constructor(
    private logger: Logger,
    private readonly userLimitRequestRepository: UserLimitRequestRepository,
    private readonly userLimitRequestEventEmitter: UserLimitRequestEventEmitterControllerInterface,
    private readonly userLimitRequestGateway: UserLimitRequestGateway,
    private readonly userService: UserService,
  ) {
    this.logger = logger.child({
      context: HandleOpenPendingUserLimitRequestController.name,
    });

    const controllerUserLimitRequestEventEmitter =
      new UserLimitRequestEventEmitterController(
        this.userLimitRequestEventEmitter,
      );

    this.usecase = new HandleOpenPendingUserLimitRequestUseCase(
      this.logger,
      this.userLimitRequestRepository,
      controllerUserLimitRequestEventEmitter,
      this.userLimitRequestGateway,
      this.userService,
    );
  }

  async execute(request: HandleOpenPendingUserLimitRequest): Promise<void> {
    this.logger.debug('Handle open pending user limit request.', { request });

    const { id } = request;

    const userLimitRequest = new UserLimitRequestEntity({
      id,
    });

    await this.usecase.execute(userLimitRequest);
  }
}
