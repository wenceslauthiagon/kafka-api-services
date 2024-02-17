import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { PixKey, PixKeyRepository } from '@zro/pix-keys/domain';

export class GetByIdPixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
  ) {
    this.logger = logger.child({ context: GetByIdPixKeyUseCase.name });
  }

  /**
   * Get the key by id.
   *
   * @param {User} user Keys' owner.
   * @param {UUID} id The key id
   * @returns {PixKey} Key found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(user: User, id: string): Promise<PixKey> {
    // Data input check
    if (!user || !id) {
      throw new MissingDataException([
        ...(!user ? ['User'] : []),
        ...(!id ? ['ID'] : []),
      ]);
    }

    // Search pixKey
    const pixKey =
      await this.pixKeyRepository.getByUserAndIdAndStateIsNotCanceled(user, id);

    this.logger.debug('Found pix key.', { pixKey });

    return pixKey;
  }
}
