import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import { User } from '@zro/users/domain';

export class GetPixKeyByKeyAndUserUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
  ) {
    this.logger = logger.child({ context: GetPixKeyByKeyAndUserUseCase.name });
  }

  /**
   * Get the key by key and user.
   *
   * @param {Key} key The key
   * @param {User} user The user
   * @returns {PixKey} Key found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(key: string, user: User): Promise<PixKey> {
    // Data input check
    if (!key || !user?.uuid) {
      throw new MissingDataException([
        ...(!key ? ['Key'] : []),
        ...(!user?.uuid ? ['User ID'] : []),
      ]);
    }

    // Search pixKey
    const pixKey =
      await this.pixKeyRepository.getByUserAndKeyAndStateIsNotCanceled(
        user,
        key,
      );

    this.logger.debug('Found pix key.', { pixKey });

    return pixKey;
  }
}
