import { Logger } from 'winston';
import {
  UserLimitRequest,
  UserLimitRequestRepository,
  UserLimitRequestState,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import {
  UserLimitRequestEventEmitter,
  UserLimitNotFoundException,
  UserLimitRequestService,
} from '@zro/compliance/application';
import { MissingDataException } from '@zro/common';

export class CreateUserLimitRequestUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userLimitRequestRepository User limit request repository.
   * @param userLimitRequestEventEmiter User limit request event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly userLimitRequestRepository: UserLimitRequestRepository,
    private readonly userLimitRequestEventEmitter: UserLimitRequestEventEmitter,
    private readonly userLimitRequestService: UserLimitRequestService,
  ) {
    this.logger = logger.child({ context: CreateUserLimitRequestUseCase.name });
  }

  /**
   * Create new User limit request.
   */
  async execute(
    userLimitRequest: UserLimitRequest,
  ): Promise<Promise<UserLimitRequest>> {
    if (
      !userLimitRequest.id ||
      !userLimitRequest.user?.uuid ||
      !userLimitRequest.userLimit?.id
    ) {
      throw new MissingDataException([
        ...(!userLimitRequest.id ? ['ID'] : []),
        ...(!userLimitRequest.user?.id ? ['User uuid'] : []),
        ...(!userLimitRequest.userLimit?.id ? ['User limit id'] : []),
      ]);
    }

    this.logger.debug('Creating user limit request.', { userLimitRequest });

    // Verify if user limit request already exists.
    const userLimitRequestFound = await this.userLimitRequestRepository.getById(
      userLimitRequest.id,
    );

    if (userLimitRequestFound) return userLimitRequestFound;

    // Check if user limit exists.
    const userLimitFound = await this.userLimitRequestService.getUserLimit(
      userLimitRequest.user,
      userLimitRequest.userLimit,
    );

    if (!userLimitFound) {
      throw new UserLimitNotFoundException(userLimitRequest.userLimit);
    }

    userLimitRequest.status = UserLimitRequestStatus.OPEN;
    userLimitRequest.state = UserLimitRequestState.OPEN_PENDING;
    userLimitRequest.limitTypeDescription = userLimitFound.limitTypeDescription;

    const userLimitRequestCreated =
      await this.userLimitRequestRepository.create(userLimitRequest);

    this.userLimitRequestEventEmitter.openPending(userLimitRequestCreated);

    return userLimitRequestCreated;
  }
}
