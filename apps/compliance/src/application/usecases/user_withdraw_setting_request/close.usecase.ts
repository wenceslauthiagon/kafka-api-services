import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestState,
  UserWithdrawSettingRequestAnalysisResultType,
} from '@zro/compliance/domain';
import {
  UserWithdrawSettingRequestEventEmitter,
  UserWithdrawSettingRequestInvalidStateException,
  UserWithdrawSettingRequestNotFoundException,
  UtilService,
} from '@zro/compliance/application';

export class CloseUserWithdrawSettingRequestUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userWithdrawSettingRequestRepository user withdraw setting request repository.
   * @param eventEmitter user withdraw setting request event emitter.
   * @param utilsService Utils service.
   */
  constructor(
    private logger: Logger,
    private readonly userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    private readonly eventEmitter: UserWithdrawSettingRequestEventEmitter,
    private readonly utilService: UtilService,
  ) {
    this.logger = logger.child({
      context: CloseUserWithdrawSettingRequestUseCase.name,
    });
  }

  /**
   * Close withdraw setting request.
   */
  async execute(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<UserWithdrawSettingRequest> {
    if (
      !userWithdrawSettingRequest?.id ||
      !userWithdrawSettingRequest?.analysisResult
    ) {
      throw new MissingDataException([
        ...(!userWithdrawSettingRequest?.id ? ['ID'] : []),
        ...(!userWithdrawSettingRequest?.analysisResult
          ? ['Analysis result']
          : []),
      ]);
    }

    const userWithdrawSettingRequestFound =
      await this.userWithdrawSettingRequestRepository.getById(
        userWithdrawSettingRequest.id,
      );

    this.logger.debug('User withdraw setting request found.', {
      userWithdrawSettingRequestFound,
    });

    if (!userWithdrawSettingRequestFound) {
      throw new UserWithdrawSettingRequestNotFoundException(
        userWithdrawSettingRequest,
      );
    }

    if (
      userWithdrawSettingRequestFound.state ===
      UserWithdrawSettingRequestState.CLOSED
    ) {
      return userWithdrawSettingRequestFound;
    }

    if (
      userWithdrawSettingRequestFound.state !==
      UserWithdrawSettingRequestState.OPEN
    ) {
      throw new UserWithdrawSettingRequestInvalidStateException({
        id: userWithdrawSettingRequest.id,
        state: userWithdrawSettingRequest.state,
      });
    }

    userWithdrawSettingRequestFound.analysisResult =
      userWithdrawSettingRequest.analysisResult;

    switch (userWithdrawSettingRequestFound.analysisResult) {
      case UserWithdrawSettingRequestAnalysisResultType.APPROVED:
        return this.closeAndApprove(userWithdrawSettingRequestFound);

      case UserWithdrawSettingRequestAnalysisResultType.REJECTED:
        return this.closeAndReject(userWithdrawSettingRequestFound);
    }
  }

  async close(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<UserWithdrawSettingRequest> {
    userWithdrawSettingRequest.state = UserWithdrawSettingRequestState.CLOSED;
    userWithdrawSettingRequest.closedAt = new Date();

    const userWithdrawSettingRequestUpdated =
      await this.userWithdrawSettingRequestRepository.update(
        userWithdrawSettingRequest,
      );

    return userWithdrawSettingRequestUpdated;
  }

  async closeAndApprove(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<UserWithdrawSettingRequest> {
    const userWithdrawSettingRequestClosed = await this.close(
      userWithdrawSettingRequest,
    );

    await this.utilService.createUserWithdrawSetting(
      userWithdrawSettingRequestClosed,
    );

    this.eventEmitter.approved(userWithdrawSettingRequestClosed);

    return userWithdrawSettingRequestClosed;
  }

  async closeAndReject(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<UserWithdrawSettingRequest> {
    const userWithdrawSettingRequestClosed = await this.close(
      userWithdrawSettingRequest,
    );

    this.eventEmitter.rejected(userWithdrawSettingRequestClosed);

    return userWithdrawSettingRequestClosed;
  }
}
