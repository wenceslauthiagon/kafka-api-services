import { Logger } from 'winston';
import {
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequest,
} from '@zro/compliance/domain';
import { MissingDataException } from '@zro/common';

export class HandleUserWithdrawSettingRequestFailedByDocumentUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userWithdrawSettingRequestRepository user withdraw setting request repository.
   */
  constructor(
    private logger: Logger,
    private readonly userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
  ) {
    this.logger = logger.child({
      context: HandleUserWithdrawSettingRequestFailedByDocumentUseCase.name,
    });
  }

  /**
   * Handle failed user withdraw setting request event by document.
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

    if (userWithdrawSettingRequestFound) {
      return;
    }

    const userWithdrawSettingRequestCreated =
      await this.userWithdrawSettingRequestRepository.create(
        userWithdrawSettingRequest,
      );

    this.logger.debug('User withdraw setting request failed created.', {
      userWithdrawSettingRequestCreated,
    });
  }
}
