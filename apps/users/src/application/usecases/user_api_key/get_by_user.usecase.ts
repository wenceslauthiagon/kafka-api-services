import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserApiKey, UserApiKeyRepository } from '@zro/users/domain';

export class GetUserApiKeyByUserUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userApiKeyRepository UserApiKey repository.
   */
  constructor(
    private logger: Logger,
    private readonly userApiKeyRepository: UserApiKeyRepository,
  ) {
    this.logger = logger.child({ context: GetUserApiKeyByUserUseCase.name });
  }

  /**
   * Get the UserApiKey by user.
   *
   * @param {User} User id.
   * @returns {UserApiKey} UserApiKey found.
   */
  async execute(user: User): Promise<UserApiKey> {
    // Data input check
    if (!user?.uuid) {
      throw new MissingDataException(['User uuid']);
    }

    // Search userApiKey
    const result = await this.userApiKeyRepository.getByUser(user);

    this.logger.debug('Found user api key.', {
      id: result?.id,
      user: result?.user,
    });

    return result;
  }
}
