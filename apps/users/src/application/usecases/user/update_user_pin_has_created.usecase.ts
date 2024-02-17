import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import {
  UserNotFoundException,
  UserPinHasCreatedIsAlreadyFalseException,
  UserEventEmitter,
} from '@zro/users/application';

export class UpdateUserPinHasCreatedUseCase {
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
    private readonly eventEmitter: UserEventEmitter,
  ) {
    this.logger = logger.child({
      context: UpdateUserPinHasCreatedUseCase.name,
    });
  }

  /**
   * Update user pin has created.
   *
   * @param uuid User uuid.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(uuid: string): Promise<void> {
    // Data input check
    if (!uuid) {
      throw new MissingDataException(['Uuid']);
    }

    const user = await this.userRepository.getByUuid(uuid);

    this.logger.debug('User found.', { user });

    if (!user) {
      throw new UserNotFoundException({ uuid });
    }

    if (!user.pinHasCreated) {
      throw new UserPinHasCreatedIsAlreadyFalseException({ uuid });
    }

    user.pinHasCreated = false;

    await this.userRepository.update(user);

    this.logger.debug('User updated.', { user });

    // Fire update pin user
    this.eventEmitter.updatePinUser(user);
  }
}
