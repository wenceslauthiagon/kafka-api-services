import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { UserLimit, UserLimitRepository } from '@zro/operations/domain';

export class GetUserLimitByIdAndUser {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param userLimitRepository User Limit repository.
   */
  constructor(
    private logger: Logger,
    private userLimitRepository: UserLimitRepository,
  ) {
    logger.child({ context: GetUserLimitByIdAndUser.name });
  }

  async execute(id: string, user: User): Promise<UserLimit> {
    // Data input check
    if (!id || !user?.id) {
      throw new MissingDataException([
        ...(!id ? ['Id'] : []),
        ...(!user?.id ? ['User id'] : []),
      ]);
    }

    const userLimit = await this.userLimitRepository.getByUserAndId(user, id);

    this.logger.debug('User limit by id and user found.', { userLimit });

    return userLimit;
  }
}
