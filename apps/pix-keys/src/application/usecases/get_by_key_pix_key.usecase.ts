import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { PixKey, PixKeyRepository } from '@zro/pix-keys/domain';

export class GetByKeyPixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
  ) {
    this.logger = logger.child({ context: GetByKeyPixKeyUseCase.name });
  }

  /**
   * Get the key by key.
   *
   * @param {Key} key The key
   * @returns {PixKey} Key found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(key: string): Promise<PixKey> {
    // Data input check
    if (!key) {
      throw new MissingDataException(['Key']);
    }

    // Search pixKey
    const [pixKey] =
      await this.pixKeyRepository.getByKeyAndStateIsNotCanceled(key);

    this.logger.debug('Found pix key.', { pixKey });

    return pixKey;
  }
}
