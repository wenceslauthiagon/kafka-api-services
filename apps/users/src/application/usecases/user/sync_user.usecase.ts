import { Logger } from 'winston';
import { UserRepository, UserState } from '@zro/users/domain';

export class SyncUserUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userRepository User repository.
   */
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
    private readonly signupExpirationInMinutes: number,
  ) {
    this.logger = logger.child({ context: SyncUserUseCase.name });
  }

  /**
   * Sync users.
   */
  async execute(): Promise<void> {
    // Search for pending users
    const expiredPendingUsers = await this.userRepository.getAllExpiredUsers(
      this.signupExpirationInMinutes,
    );
    this.logger.debug('Found expired users.', {
      users: expiredPendingUsers.length,
    });

    for (const usr of expiredPendingUsers) {
      const randomPos = Math.random().toString(32).slice(-5);

      if (!usr.phoneNumber.includes('dup_')) {
        usr.phoneNumber = `exp_${usr.phoneNumber}_${randomPos}`;
      }
      if (usr.email) usr.email = `exp_${usr.email}_${randomPos}`;
      usr.state = UserState.EXPIRED;

      const updatedUser = await this.userRepository.update(usr);
      await this.userRepository.delete(updatedUser);
    }
  }
}
