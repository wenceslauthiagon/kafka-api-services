import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';

export class GetUserByEmailUseCase {
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: GetUserByEmailUseCase.name });
  }

  /**
   * Get user by email.
   *
   * @param email User email.
   * @returns The user found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(email: string): Promise<User> {
    // Data input check
    if (!email) {
      throw new MissingDataException(['Email']);
    }

    // Search user
    const user = await this.userRepository.getByEmail(email);

    this.logger.debug('User found.', { user });

    return user;
  }
}
