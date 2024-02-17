import { Logger } from 'winston';
import {
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import {
  UserWithdrawSettingRequestEventEmitter,
  UserWithdrawSettingRequestNotFoundException,
} from '@zro/compliance/application';
import { MissingDataException } from '@zro/common';

export class HandleUserWithdrawSettingRequestFailedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userWithdrawSettingRequestRepository user withdraw setting request repository.
   * @param eventEmitter user withdraw setting request event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    private readonly eventEmitter: UserWithdrawSettingRequestEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleUserWithdrawSettingRequestFailedUseCase.name,
    });
  }

  /**
   * Handle failed user withdraw setting request event.
   */
  async execute(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<void> {
    if (!userWithdrawSettingRequest?.id) {
      throw new MissingDataException(['User withdraw setting request id']);
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
      UserWithdrawSettingRequestState.FAILED
    ) {
      return;
    }

    userWithdrawSettingRequestFound.state =
      UserWithdrawSettingRequestState.FAILED;

    const userWithdrawSettingRequestUpdated =
      await this.userWithdrawSettingRequestRepository.update(
        userWithdrawSettingRequestFound,
      );

    this.logger.debug('User withdraw setting request updated.', {
      userWithdrawSettingRequestUpdated,
    });

    this.eventEmitter.failed(userWithdrawSettingRequestUpdated);
  }
}
