import { Logger } from 'winston';
import { MissingDataException, getMoment } from '@zro/common';
import {
  UserForgotPasswordState,
  UserForgotPasswordRepository,
  UserForgotPassword,
  UserRepository,
  User,
} from '@zro/users/domain';
import {
  UserForgotPasswordInvalidStateException,
  UserForgotPasswordNotFoundException,
  UserForgotPasswordEventEmitter,
  UserForgotPasswordMaxAttemptsException,
  UserForgotPasswordExpiredException,
} from '@zro/users/application';

export class UpdateUserForgotPasswordUseCase {
  constructor(
    private readonly logger: Logger,
    private readonly userRepository: UserRepository,
    private readonly userForgotPasswordRepository: UserForgotPasswordRepository,
    private readonly eventEmitter: UserForgotPasswordEventEmitter,
    private readonly maxAttempts: number,
    private readonly expirationSeconds: number,
  ) {
    this.logger = logger.child({
      context: UpdateUserForgotPasswordUseCase.name,
    });
  }

  /**
   * Update user forgot password.
   *
   * @param id string.
   * @param code Confirmation code.
   * @param newPassword New user password.
   * @returns The user with password updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    id: string,
    code: string,
    newPassword: string,
  ): Promise<UserForgotPassword> {
    // Data input check
    if (!id || !code || !newPassword) {
      throw new MissingDataException([
        ...(!id ? ['Id'] : []),
        ...(!code ? ['Code'] : []),
        ...(!newPassword ? ['New password'] : []),
      ]);
    }

    // Search user forgot password by id
    const userForgotPasswordFound =
      await this.userForgotPasswordRepository.getById(id);

    this.logger.debug('User forgot password found.', {
      userForgotPassword: userForgotPasswordFound,
    });

    // Check if user forgot password exists
    if (!userForgotPasswordFound) {
      throw new UserForgotPasswordNotFoundException({ id });
    }

    if (userForgotPasswordFound.state === UserForgotPasswordState.DECLINED) {
      throw new UserForgotPasswordMaxAttemptsException({ id });
    }

    if (userForgotPasswordFound.state === UserForgotPasswordState.EXPIRED) {
      throw new UserForgotPasswordExpiredException({ id });
    }

    if (userForgotPasswordFound.state !== UserForgotPasswordState.PENDING) {
      throw new UserForgotPasswordInvalidStateException({ id });
    }

    const isExpired = getMoment()
      .subtract(this.expirationSeconds, 'seconds')
      .isAfter(getMoment(userForgotPasswordFound.createdAt));

    if (isExpired) {
      await this.expire(userForgotPasswordFound);

      return userForgotPasswordFound;
    }

    // Increase the change password number of attempts.
    userForgotPasswordFound.attempts += 1;

    const isLastAttempt = userForgotPasswordFound.attempts >= this.maxAttempts;
    const isWrongCode = userForgotPasswordFound.code !== code;

    if (isWrongCode && isLastAttempt) {
      await this.decline(userForgotPasswordFound);

      return userForgotPasswordFound;
    }

    if (isWrongCode) {
      await this.userForgotPasswordRepository.update(userForgotPasswordFound);

      return userForgotPasswordFound;
    }

    await this.updateUserPassword(userForgotPasswordFound.user, newPassword);

    await this.confirm(userForgotPasswordFound);

    this.logger.debug('User forgot password confirmed.', {
      userForgotPassword: userForgotPasswordFound,
    });

    return userForgotPasswordFound;
  }

  async decline(userForgotPassword: UserForgotPassword): Promise<void> {
    userForgotPassword.state = UserForgotPasswordState.DECLINED;

    await this.userForgotPasswordRepository.update(userForgotPassword);

    this.eventEmitter.declined(userForgotPassword);
  }

  async expire(userForgotPassword: UserForgotPassword): Promise<void> {
    userForgotPassword.state = UserForgotPasswordState.EXPIRED;
    userForgotPassword.expiredAt = new Date();

    await this.userForgotPasswordRepository.update(userForgotPassword);

    this.eventEmitter.expired(userForgotPassword);
  }

  async confirm(userForgotPassword: UserForgotPassword): Promise<void> {
    userForgotPassword.state = UserForgotPasswordState.CONFIRMED;

    await this.userForgotPasswordRepository.update(userForgotPassword);

    this.eventEmitter.confirmed(userForgotPassword);
  }

  async updateUserPassword(user: User, newPassword: string): Promise<User> {
    const userFound = await this.userRepository.getByUuid(user.uuid);

    userFound.password = newPassword;

    await this.userRepository.update(userFound);

    return userFound;
  }
}
