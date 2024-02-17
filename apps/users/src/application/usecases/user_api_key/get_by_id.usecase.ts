import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { UserApiKey, UserApiKeyRepository } from '@zro/users/domain';

export class GetUserApiKeyByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userApiKeyRepository UserApiKey repository.
   */
  constructor(
    private logger: Logger,
    private readonly userApiKeyRepository: UserApiKeyRepository,
  ) {
    this.logger = logger.child({ context: GetUserApiKeyByIdUseCase.name });
  }

  /**
   * Get the UserApiKey by id.
   *
   * @param {string} id UserApiKey id.
   * @returns {UserApiKey} UserApiKey found.
   */
  async execute(id: string): Promise<UserApiKey> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['Api Key ID']);
    }

    // Search userApiKey
    const result = await this.userApiKeyRepository.getById(id);

    this.logger.debug('Found user api key.', {
      id: result?.id,
      user: result?.user,
    });

    return result;
  }
}
