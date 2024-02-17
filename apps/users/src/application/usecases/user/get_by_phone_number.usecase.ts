import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';

export class GetUserByPhoneNumberUseCase {
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: GetUserByPhoneNumberUseCase.name });
  }

  /**
   * Get user by phone number.
   *
   * @param phoneNumber User phone number.
   * @returns The user found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(phoneNumber: string): Promise<User> {
    // Data input check
    if (!phoneNumber) {
      throw new MissingDataException(['Phone Number']);
    }

    // Search user
    const user = await this.userRepository.getByPhoneNumber(phoneNumber);

    this.logger.debug('User found.', { user });

    return user;
  }
}
