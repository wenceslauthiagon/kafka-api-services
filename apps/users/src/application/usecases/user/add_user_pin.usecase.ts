import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';
import {
  UserNotFoundException,
  UserPinAlreadyExistsException,
  UserEventEmitter,
} from '@zro/users/application';

export class AddUserPinUseCase {
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
    private readonly eventEmitter: UserEventEmitter,
  ) {
    this.logger = logger.child({ context: AddUserPinUseCase.name });
  }

  /**
   * Add user pin.
   *
   * @param uuid User uuid.
   * @param pin User pin.
   * @returns The updated user.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(uuid: string, pin: string): Promise<User> {
    // Data input check
    if (!uuid || !pin) {
      throw new MissingDataException([
        ...(!uuid ? ['Uuid'] : []),
        ...(!pin ? ['Pin'] : []),
      ]);
    }

    const user = await this.userRepository.getByUuid(uuid);

    this.logger.debug('User found.', { uuid });

    if (!user) {
      throw new UserNotFoundException({ uuid });
    }

    if (user.pinHasCreated) {
      throw new UserPinAlreadyExistsException(user);
    }

    user.pin = pin;
    user.pinHasCreated = true;

    await this.userRepository.update(user);

    this.logger.debug('User updated.', { user });

    // Fire add pin user
    this.eventEmitter.addPinUser(user);

    return user;
  }
}
