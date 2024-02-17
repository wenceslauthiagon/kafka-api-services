import { Logger } from 'winston';
import {
  UserLimitRequest,
  UserLimitRequestRepository,
  UserLimitRequestState,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import {
  UserLimitRequestEventEmitter,
  UserLimitRequestGateway,
  UserLimitRequestNotFoundException,
  CreateUserLimitRequestPspRequest,
  UserService,
} from '@zro/compliance/application';
import { MissingDataException } from '@zro/common';

export class HandleOpenPendingUserLimitRequestUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userLimitRequestRepository User limit request repository.
   * @param userLimitRequestEventEmitter User limit request event emitter.
   * @param userLimitRequestGateway User limit request PSP Gateway.
   * @param userService User service.
   */
  constructor(
    private logger: Logger,
    private readonly userLimitRequestRepository: UserLimitRequestRepository,
    private readonly userLimitRequestEventEmitter: UserLimitRequestEventEmitter,
    private readonly userLimitRequestGateway: UserLimitRequestGateway,
    private readonly userService: UserService,
  ) {
    this.logger = logger.child({
      context: HandleOpenPendingUserLimitRequestUseCase.name,
    });
  }

  /**
   * Handle open pending user limit request.
   */
  async execute(userLimitRequest: UserLimitRequest): Promise<void> {
    if (!userLimitRequest.id) {
      throw new MissingDataException(['User limit request ID']);
    }

    this.logger.debug('Handle open pending user limit request.', {
      userLimitRequest,
    });

    const userLimitRequestFound = await this.userLimitRequestRepository.getById(
      userLimitRequest.id,
    );

    if (!userLimitRequestFound) {
      throw new UserLimitRequestNotFoundException(userLimitRequest);
    }

    this.logger.debug('User limit request found.', {
      userLimitRequestFound,
    });

    if (
      userLimitRequestFound.status !== UserLimitRequestStatus.OPEN ||
      userLimitRequestFound.state !== UserLimitRequestState.OPEN_PENDING
    ) {
      return;
    }

    const userFound = await this.userService.getByUuid(
      userLimitRequestFound.user.uuid,
    );

    const request: CreateUserLimitRequestPspRequest = {
      id: userLimitRequestFound.id,
      userId: userLimitRequestFound.user.uuid,
      userDocument: userFound.document,
      userLimitId: userLimitRequestFound.userLimit.id,
      limitTypeDescription: userLimitRequestFound.limitTypeDescription,
      requestYearlyLimit: userLimitRequestFound.requestYearlyLimit,
      requestMonthlyLimit: userLimitRequestFound.requestMonthlyLimit,
      requestDailyLimit: userLimitRequestFound.requestDailyLimit,
      requestNightlyLimit: userLimitRequestFound.requestNightlyLimit,
      requestMaxAmount: userLimitRequestFound.requestMaxAmount,
      requestMinAmount: userLimitRequestFound.requestMinAmount,
      requestMaxAmountNightly: userLimitRequestFound.requestMaxAmountNightly,
      requestMinAmountNightly: userLimitRequestFound.requestMinAmountNightly,
    };

    await this.userLimitRequestGateway.createUserLimitRequest(request);

    this.logger.debug('User limit request created in gateway.');

    userLimitRequestFound.state = UserLimitRequestState.OPEN_CONFIRMED;

    await this.userLimitRequestRepository.update(userLimitRequestFound);

    this.logger.debug('User limit request updated with open confirmed state.');

    this.userLimitRequestEventEmitter.openConfirmed(userLimitRequestFound);
  }
}
