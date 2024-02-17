import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  User,
  UserForgotPasswordState,
  UserForgotPasswordRepository,
} from '@zro/users/domain';
import {
  UserForgotPasswordInvalidStateException,
  UserForgotPasswordNotFoundException,
  UserForgotPasswordEventEmitter,
} from '@zro/users/application';

export class DeclineUserForgotPasswordUseCase {
  constructor(
    private readonly logger: Logger,
    private readonly userForgotPasswordRepository: UserForgotPasswordRepository,
    private readonly eventEmitter: UserForgotPasswordEventEmitter,
  ) {
    this.logger = logger.child({
      context: DeclineUserForgotPasswordUseCase.name,
    });
  }

  /**
   * Create user forgot password.
   *
   * @param id string.
   * @param user User.
   * @returns The user forgot password created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string, user: User): Promise<void> {
    // Data input check
    if (!user?.uuid || !id) {
      throw new MissingDataException([
        ...(!id ? ['Id'] : []),
        ...(!user?.uuid ? ['User UUID'] : []),
      ]);
    }

    // Search user forgot password by id
    const userForgotPasswordFound =
      await this.userForgotPasswordRepository.getByIdAndUser(id, user);

    this.logger.debug('User forgot password found.', {
      userForgotPassword: userForgotPasswordFound,
    });

    // Check if user forgot password exists
    if (!userForgotPasswordFound) {
      throw new UserForgotPasswordNotFoundException({ id });
    }

    if (userForgotPasswordFound.isAlreadyInvalid()) {
      return;
    }

    if (userForgotPasswordFound.state !== UserForgotPasswordState.PENDING) {
      throw new UserForgotPasswordInvalidStateException({ id });
    }

    // update user forgot password to declined
    userForgotPasswordFound.state = UserForgotPasswordState.DECLINED;

    await this.userForgotPasswordRepository.update(userForgotPasswordFound);

    this.logger.debug('User forgot password declined.', {
      userForgotPassword: userForgotPasswordFound,
    });

    // Fire declined event
    this.eventEmitter.declined(userForgotPasswordFound);
  }
}
