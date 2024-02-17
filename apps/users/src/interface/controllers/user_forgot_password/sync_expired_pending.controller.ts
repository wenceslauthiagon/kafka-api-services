import { Logger } from 'winston';
import { UserForgotPasswordRepository } from '@zro/users/domain';
import { SyncPendingExpiredUserForgotPasswordInvitationUseCase as UseCase } from '@zro/users/application';

export class SyncPendingExpiredUserForgotPasswordController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userForgotPasswordRepository: UserForgotPasswordRepository,
    timestamp: number,
  ) {
    this.logger = logger.child({
      context: SyncPendingExpiredUserForgotPasswordController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      userForgotPasswordRepository,
      timestamp,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync users forgot password request.');

    await this.usecase.execute();
  }
}
