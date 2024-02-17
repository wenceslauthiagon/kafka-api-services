import { Logger } from 'winston';
import {
  UserForgotPasswordState,
  UserForgotPasswordRepository,
} from '@zro/users/domain';
import { getMoment } from '@zro/common';

export class SyncPendingExpiredUserForgotPasswordInvitationUseCase {
  constructor(
    private readonly logger: Logger,
    private readonly userForgotPasswordRepository: UserForgotPasswordRepository,
    private readonly timestamp: number,
  ) {
    this.logger = logger.child({
      context: SyncPendingExpiredUserForgotPasswordInvitationUseCase.name,
    });
  }

  /**
   * Sync expired pending user forgot password.
   *
   * @returns void.
   */
  async execute(): Promise<void> {
    const states = [UserForgotPasswordState.PENDING];
    const createdAtFilter = getMoment()
      .subtract(this.timestamp, 'seconds')
      .toDate();

    // Search user forgot password by id
    const usersForgotPassword =
      await this.userForgotPasswordRepository.getByCreatedAtLessThanAndStateIn(
        createdAtFilter,
        states,
      );

    this.logger.debug('Users forgot password found.', {
      usersForgotPassword,
    });

    if (!usersForgotPassword.length) return;

    const promises = usersForgotPassword.map((userForgotPassword) => {
      userForgotPassword.state = UserForgotPasswordState.EXPIRED;
      userForgotPassword.expiredAt = new Date();
      return this.userForgotPasswordRepository.update(userForgotPassword);
    });

    await Promise.all(promises);

    this.logger.debug('Users forgot password updated.', {
      usersForgotPassword,
    });
  }
}
