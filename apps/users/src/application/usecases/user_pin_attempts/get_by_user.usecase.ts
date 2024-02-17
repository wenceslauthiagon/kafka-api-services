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

export class GetUserPinAttemptsByUserUseCase {
  constructor(
    private logger: Logger,
    private userRepository: UserRepository,
    private userPinAttemptsRepository: UserPinAttemptsRepository,
    private eventEmitter: UserPinAttemptsEventEmitter,
  ) {
    this.logger = logger.child({
      context: GetUserPinAttemptsByUserUseCase.name,
    });
  }

  /**
   * Get by user uuid.
   *
   * @param user User.
   * @returns The user pin attempts found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(user: User): Promise<UserPinAttempts> {
    if (!user?.uuid) {
      throw new MissingDataException(['Uuid']);
    }

    // Search user
    const foundUser = await this.userRepository.getByUuid(user.uuid);

    this.logger.debug('User found.', { user });

    if (!foundUser) {
      throw new UserNotFoundException(user);
    }

    // Search user pin attempts
    let userAttempts: UserPinAttempts =
      await this.userPinAttemptsRepository.getByUser(foundUser);

    // If not found, create a new one.
    if (!userAttempts) {
      userAttempts = new UserPinAttemptsEntity({
        user: foundUser,
        attempts: 0,
      });

      await this.userPinAttemptsRepository.create(userAttempts);

      this.eventEmitter.updatedUserPinAttempts(userAttempts);
    } else {
      // If not, just relate it to found user.
      userAttempts.user = foundUser;
    }

    return userAttempts;
  }
}
