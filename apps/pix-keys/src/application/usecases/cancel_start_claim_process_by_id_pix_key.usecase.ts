import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';

export class CancelStartClaimProcessByIdPixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
  ) {
    this.logger = logger.child({
      context: CancelStartClaimProcessByIdPixKeyUseCase.name,
    });
  }

  /**
   * Cancel the start claim process of pixKey by user and id.
   *
   * @param user Keys' owner.
   * @param id The key id
   * @returns Key found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixKeyNotFoundException} Thrown when key id was not found.
   * @throws {PixKeyInvalidStateException} Thrown when key state is not valid.
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

    if (!pixKey) {
      throw new PixKeyNotFoundException({ id });
    }

    if (pixKey.state !== KeyState.OWNERSHIP_PENDING) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    pixKey.state = KeyState.CANCELED;
    pixKey.canceledAt = new Date();

    await this.pixKeyRepository.update(pixKey);

    this.logger.debug('Pix key updated.', { pixKey });

    return pixKey;
  }
}
