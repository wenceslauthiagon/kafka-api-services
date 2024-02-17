import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  User,
  UserForgotPasswordRepository,
  UserForgotPasswordState,
  UserRepository,
} from '@zro/users/domain';
import {
  UserNotFoundException,
  UserEventEmitter,
  UserIsAlreadyChangePasswordException,
} from '@zro/users/application';

export class UpdateUserPinUseCase {
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
    private readonly userForgotPasswordRepository: UserForgotPasswordRepository,
    private readonly eventEmitter: UserEventEmitter,
  ) {
    this.logger = logger.child({ context: UpdateUserPinUseCase.name });
  }

  /**
   * Update user pin.
   *
   * @param uuid User uuid.
   * @param newPin User pin.
   * @returns The updated user.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(uuid: string, newPin: string): Promise<User> {
    // Data input check
    if (!uuid || !newPin) {
      throw new MissingDataException([
        ...(!uuid ? ['Uuid'] : []),
        ...(!newPin ? ['New Pin'] : []),
      ]);
    }

    const user = await this.userRepository.getByUuid(uuid);

    this.logger.debug('User found.', { uuid });

    if (!user) {
      throw new UserNotFoundException({ uuid });
    }

    const userForgotPassword =
      await this.userForgotPasswordRepository.getByUserAndState(
        user,
        UserForgotPasswordState.PENDING,
      );

    if (userForgotPassword) {
      throw new UserIsAlreadyChangePasswordException(user);
    }

    user.pin = newPin;

    await this.userRepository.update(user);

    this.logger.debug('User updated.', { user });

    // Fire update pin user
    this.eventEmitter.updatePinUser(user);

    return user;
  }
}
