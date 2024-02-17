import { Logger } from 'winston';
import { UserRepository } from '@zro/users/domain';
import { SyncUserUseCase as UseCase } from '@zro/users/application';

export class SyncUserController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    signupExpirationInMinutes: number,
  ) {
    this.logger = logger.child({ context: SyncUserController.name });

    this.usecase = new UseCase(
      this.logger,
      userRepository,
      signupExpirationInMinutes,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync user request.');
    await this.usecase.execute();
  }
}
