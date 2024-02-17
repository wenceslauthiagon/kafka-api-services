import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import { UserNotFoundException } from '@zro/users/application';

export class GetUserHasPinUseCase {
  /**
   * Default constructor.
   *
   */
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: GetUserHasPinUseCase.name });
  }

  /**
   * Get user pin.
   *
   * @param user User uuid.
   * @returns if has pin.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(uuid: string): Promise<boolean> {
    // Data input check
    if (!uuid) {
      throw new MissingDataException(['User']);
    }

    const userFound = await this.userRepository.getByUuid(uuid);
    this.logger.debug('Found User.', { user: userFound });

    if (!userFound) {
      throw new UserNotFoundException({ uuid });
    }

    return userFound.pinHasCreated;
  }
}
