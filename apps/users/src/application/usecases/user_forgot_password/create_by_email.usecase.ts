import { Logger } from 'winston';
import {
  User,
  UserForgotPassword,
  UserForgotPasswordEntity,
  UserForgotPasswordId,
  UserForgotPasswordRepository,
  UserForgotPasswordState,
  UserRepository,
} from '@zro/users/domain';
import {
  UserForgotPasswordEventEmitter,
  NotificationService,
} from '@zro/users/application';
import { createRandomNumberCode, MissingDataException } from '@zro/common';

export class CreateUserForgotPasswordByEmailUseCase {
  constructor(
    private readonly logger: Logger,
    private readonly userRepository: UserRepository,
    private readonly userForgotPasswordRepository: UserForgotPasswordRepository,
    private readonly eventEmitter: UserForgotPasswordEventEmitter,
    private readonly notificationService: NotificationService,
    private readonly emailTag: string,
    private readonly emailFrom: string,
  ) {
    this.logger = logger.child({
      context: CreateUserForgotPasswordByEmailUseCase.name,
    });
  }

  /**
   * Create user forgot password.
   *
   * @param user User.
   * @param id Id do forgot password.
   * @returns The user forgot password created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    user: User,
    id: UserForgotPasswordId,
  ): Promise<UserForgotPassword> {
    if (!user?.email || !id) {
      throw new MissingDataException([
        ...(!user?.email ? ['User Email'] : []),
        ...(!id ? ['Id'] : []),
      ]);
    }

    // Check if user exists
    const foundUser = await this.userRepository.getByEmail(user.email);

    this.logger.debug('Found user.', { user: foundUser });

    if (!foundUser) {
      return;
    }

    // Check if forgot password already exists
    const userForgotPasswordAlreadyExists =
      await this.userForgotPasswordRepository.getById(id);

    if (userForgotPasswordAlreadyExists) {
      return;
    }

    const foundUserForgotPassword =
      await this.userForgotPasswordRepository.getByUserAndState(
        foundUser,
        UserForgotPasswordState.PENDING,
      );

    this.logger.debug('Found user forgot password.', {
      userForgotPassword: foundUserForgotPassword,
    });

    if (foundUserForgotPassword) {
      await this.declineUserForgotPassword(foundUserForgotPassword);
    }

    const newUserForgotPassword = await this.createUserForgotPassword(
      id,
      foundUser,
    );

    this.logger.debug('Created new user forgot password.', {
      userForgotPassword: newUserForgotPassword,
    });

    return newUserForgotPassword;
  }

  async declineUserForgotPassword(
    userForgotPassword: UserForgotPassword,
  ): Promise<void> {
    userForgotPassword.state = UserForgotPasswordState.DECLINED;

    await this.userForgotPasswordRepository.update(userForgotPassword);
  }

  async createUserForgotPassword(
    id: string,
    user: User,
  ): Promise<UserForgotPassword> {
    const newUserForgotPassword = new UserForgotPasswordEntity({
      id,
      state: UserForgotPasswordState.PENDING,
      user,
      phoneNumber: user.phoneNumber,
      code: createRandomNumberCode(5),
      attempts: 0,
      email: user.email,
    });

    const newUserForgotPasswordCreated =
      await this.userForgotPasswordRepository.create(newUserForgotPassword);

    this.eventEmitter.created(newUserForgotPassword);

    await this.notificationService.sendEmail(
      newUserForgotPasswordCreated,
      this.emailFrom,
      this.emailTag,
    );

    return newUserForgotPasswordCreated;
  }
}
