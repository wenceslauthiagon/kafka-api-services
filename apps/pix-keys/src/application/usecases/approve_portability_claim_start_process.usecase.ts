import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';

export class ApprovePortabilityClaimStartProcessUseCase {
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
  ) {
    this.logger = logger.child({
      context: ApprovePortabilityClaimStartProcessUseCase.name,
    });
  }

  /**
   * Start portability process. A request will be sent to DICT to claim for a key.
   * @param user The user.
   * @param id Key id.
   * @return Target pix key.
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

    // Key is canceled or is not owned by user.
    if (!pixKey) {
      throw new PixKeyNotFoundException({ id });
    }

    // Indepotent execution.
    if (pixKey.state === KeyState.PORTABILITY_OPENED) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.PORTABILITY_PENDING) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    // Key is ready to be claimed on DICT.
    pixKey.state = KeyState.PORTABILITY_OPENED;

    // Update pixKey state
    await this.pixKeyRepository.update(pixKey);

    // Fire portability opened event.
    this.eventEmitter.portabilityOpenedPixKey(pixKey);

    this.logger.debug('Portability opened.', { pixKey });

    return pixKey;
  }
}
