import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';
import { UserNotFoundException } from '@zro/users/application';

export class ChangeUserPasswordUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userRepository User repository.
   */
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: ChangeUserPasswordUseCase.name });
  }

  /**
   * Update user password.
   *
   * @param user User to update password.
   * @param password The new user password.
   * @returns User updated.
   */
  async execute(user: User, password: string): Promise<User> {
    if (!user?.uuid || !password) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!password ? ['Password'] : []),
      ]);
    }

    const userFound = await this.userRepository.getByUuid(user.uuid);

    if (!userFound) {
      throw new UserNotFoundException(user);
    }

    this.logger.debug('User found', { userFound });

    userFound.password = password;

    await this.userRepository.update(userFound);

    this.logger.debug('User updated', { userFound });

    return userFound;
  }
}
