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

export class CreateUserForgotPasswordBySmsUseCase {
  constructor(
    private readonly logger: Logger,
    private readonly userRepository: UserRepository,
    private readonly userForgotPasswordRepository: UserForgotPasswordRepository,
    private readonly eventEmitter: UserForgotPasswordEventEmitter,
    private readonly notificationService: NotificationService,
    private readonly smsTag: string,
  ) {
    this.logger = logger.child({
      context: CreateUserForgotPasswordBySmsUseCase.name,
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
    if (!user?.phoneNumber || !id) {
      throw new MissingDataException([
        ...(!user?.phoneNumber ? ['User phoneNumber'] : []),
        ...(!id ? ['Id'] : []),
      ]);
    }

    const foundUser = await this.userRepository.getByPhoneNumber(
      user.phoneNumber,
    );

    this.logger.debug('User found.', { user });

    if (!foundUser) {
      return;
    }

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

    if (foundUserForgotPassword) {
      await this.declineUserForgotPassword(foundUserForgotPassword);
    }

    const newUserForgotPassword = await this.createUserForgotPassword(
      id,
      foundUser,
    );

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
    });

    const newUserForgotPasswordCreated =
      await this.userForgotPasswordRepository.create(newUserForgotPassword);

    this.eventEmitter.created(newUserForgotPassword);

    await this.notificationService.sendSms(
      newUserForgotPasswordCreated,
      this.smsTag,
    );

    return newUserForgotPasswordCreated;
  }
}
