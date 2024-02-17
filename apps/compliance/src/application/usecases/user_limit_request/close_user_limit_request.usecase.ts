import { Logger } from 'winston';
import {
  UserLimitRequest,
  UserLimitRequestAnalysisResultType,
  UserLimitRequestRepository,
  UserLimitRequestState,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import {
  UserLimitRequestEventEmitter,
  UserLimitRequestInvalidStateException,
  UserLimitRequestInvalidStatusException,
  UserLimitRequestNotFoundException,
} from '@zro/compliance/application';
import { MissingDataException } from '@zro/common';

export class CloseUserLimitRequestUseCase {
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
  ) {
    this.logger = logger.child({
      context: CloseUserLimitRequestUseCase.name,
    });
  }

  /**
   * Close user limit request.
   */
  async execute(userLimitRequest: UserLimitRequest): Promise<Promise<void>> {
    if (!userLimitRequest.id || !userLimitRequest.analysisResult) {
      throw new MissingDataException([
        ...(!userLimitRequest.id ? ['User limit request ID'] : []),
        ...(!userLimitRequest.analysisResult ? ['analysisResult'] : []),
      ]);
    }

    this.logger.debug('Close user limit request.', { userLimitRequest });

    // Check if user limit request exists.
    const userLimitRequestFound = await this.userLimitRequestRepository.getById(
      userLimitRequest.id,
    );

    if (!userLimitRequestFound) {
      throw new UserLimitRequestNotFoundException(userLimitRequest.userLimit);
    }

    if (userLimitRequestFound.status !== UserLimitRequestStatus.OPEN) {
      throw new UserLimitRequestInvalidStatusException(userLimitRequestFound);
    }

    if (userLimitRequestFound.state !== UserLimitRequestState.OPEN_CONFIRMED) {
      throw new UserLimitRequestInvalidStateException(userLimitRequestFound);
    }

    userLimitRequestFound.analysisResult = userLimitRequest.analysisResult;

    switch (userLimitRequest.analysisResult) {
      case UserLimitRequestAnalysisResultType.APPROVED:
        return this.closeConfirmedApproved(userLimitRequestFound);

      case UserLimitRequestAnalysisResultType.REJECTED:
        return this.closeConfirmedRejected(userLimitRequestFound);
    }
  }

  async closeConfirmedApproved(userLimitRequest: UserLimitRequest) {
    userLimitRequest.status = UserLimitRequestStatus.CLOSED;
    userLimitRequest.state = UserLimitRequestState.CLOSED_CONFIRMED_APPROVED;

    await this.userLimitRequestRepository.update(userLimitRequest);

    return this.userLimitRequestEventEmitter.closedConfirmedApproved(
      userLimitRequest,
    );
  }

  async closeConfirmedRejected(userLimitRequest: UserLimitRequest) {
    userLimitRequest.status = UserLimitRequestStatus.CLOSED;
    userLimitRequest.state = UserLimitRequestState.CLOSED_CONFIRMED_REJECTED;

    await this.userLimitRequestRepository.update(userLimitRequest);

    return this.userLimitRequestEventEmitter.closedConfirmedRejected(
      userLimitRequest,
    );
  }
}
