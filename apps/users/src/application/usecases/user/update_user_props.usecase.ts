import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';
import { UserNotFoundException } from '@zro/users/application';

export class UpdateUserPropsUseCase {
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: UpdateUserPropsUseCase.name });
  }

  /**
   * Update user props.
   *
   * @param uuid User uuid.
   * @returns The updated user.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    uuid: string,
    propKey: string,
    propValue: string,
  ): Promise<User> {
    // Data input check
    if (!uuid || !propKey || !propValue) {
      throw new MissingDataException([
        ...(!uuid ? ['Uuid'] : []),
        ...(!propKey ? ['Prop Key'] : []),
        ...(!propValue ? ['Prop Value'] : []),
      ]);
    }

    const user = await this.userRepository.getByUuid(uuid);

    this.logger.debug('User found.', { user });

    if (!user) {
      throw new UserNotFoundException({ uuid });
    }

    const updatedUserProps = { ...user.props, [propKey]: propValue };
    user.props = updatedUserProps;

    await this.userRepository.update(user);

    this.logger.debug('User updated.', { user });

    return user;
  }
}
