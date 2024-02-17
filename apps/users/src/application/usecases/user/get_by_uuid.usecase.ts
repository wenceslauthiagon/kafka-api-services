import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';

export class GetUserByUuidUseCase {
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: GetUserByUuidUseCase.name });
  }

  /**
   * Get user by uuid.
   *
   * @param uuid User uuid.
   * @returns The user found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(uuid: string): Promise<User> {
    // Data input check
    if (!uuid) {
      throw new MissingDataException(['Uuid']);
    }

    // Search user
    const user = await this.userRepository.getByUuid(uuid);

    this.logger.debug('User found.', { user });

    return user;
  }
}
