import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  User,
  UserPinAttempts,
  UserPinAttemptsEntity,
  UserPinAttemptsRepository,
  UserRepository,
} from '@zro/users/domain';
import {
  UserNotFoundException,
  UserPinAttemptsEventEmitter,
} from '@zro/users/application';

export class UpdateUserPinAttemptsUseCase {
  constructor(
    private logger: Logger,
    private userRepository: UserRepository,
    private userPinAttemptsRepository: UserPinAttemptsRepository,
    private eventEmitter: UserPinAttemptsEventEmitter,
  ) {
    this.logger = logger.child({ context: UpdateUserPinAttemptsUseCase.name });
  }

  /**
   * Update user pin attempts.
   *
   * @param user Onwer user.
   * @param attempts Number attempts to update. Default is 0.
   * @returns The user pin attempts updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(user: User, attempts = 0): Promise<UserPinAttempts> {
    this.logger.debug('Update user pin attempts.', { user, attempts });

    if (!user?.uuid) {
      throw new MissingDataException(['User']);
    }

    // Search user
    const userFound = await this.userRepository.getByUuid(user.uuid);

    this.logger.debug('User found.', { user });

    if (!userFound) {
      throw new UserNotFoundException(user);
    }

    // Search user pin attempts
    let userAttempts: UserPinAttempts =
      await this.userPinAttemptsRepository.getByUser(userFound);

    // If not found then create a new one.
    if (!userAttempts) {
      userAttempts = new UserPinAttemptsEntity({
        user: userFound,
        attempts,
      });

      await this.userPinAttemptsRepository.create(userAttempts);
    } else {
      // or update existing one.
      userAttempts.attempts = attempts;
      userAttempts.user = userFound;

      await this.userPinAttemptsRepository.update(userAttempts);
    }

    this.eventEmitter.updatedUserPinAttempts(userAttempts);

    return userAttempts;
  }
}
