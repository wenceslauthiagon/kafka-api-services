import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';

export class GetUserByIdUseCase {
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: GetUserByIdUseCase.name });
  }

  /**
   * Get user by id.
   *
   * @param id User id.
   * @returns The user found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: User['id']): Promise<User> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search user
    const user = await this.userRepository.getById(id);

    this.logger.debug('User found.', { user });

    return user;
  }
}
