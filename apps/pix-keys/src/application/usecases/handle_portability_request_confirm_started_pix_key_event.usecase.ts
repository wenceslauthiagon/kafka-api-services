import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  KeyState,
  PixKey,
  PixKeyClaimEntity,
  PixKeyClaimRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';

export class HandlePortabilityRequestConfirmStartedPixKeyEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param pixKeyClaimRepository Pix key claim repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly pixKeyClaimRepository: PixKeyClaimRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandlePortabilityRequestConfirmStartedPixKeyEventUseCase.name,
    });
  }

  /**
   * Update the portability state to confirmed.
   *
   * @param id The key id
   * @returns Key updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixKeyNotFoundException} Thrown when key id was not found.
   * @throws {PixKeyInvalidStateException} Thrown when key state is not valid.
   */
  async execute(id: string): Promise<PixKey> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search pixKey
    const pixKey = await this.pixKeyRepository.getById(id);

    this.logger.debug('Found PixKey.', { pixKey });

    if (!pixKey) {
      throw new PixKeyNotFoundException({ id });
    }

    // Indeponent retry
    if (pixKey.state === KeyState.CANCELED) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.PORTABILITY_REQUEST_CONFIRM_STARTED) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    pixKey.state = KeyState.CANCELED;
    pixKey.canceledAt = new Date();

    // Save claim closing date.
    const pixKeyClaim = new PixKeyClaimEntity({
      id: pixKey.claim.id,
      claimClosingDate: pixKey.canceledAt,
    });

    await this.pixKeyRepository.update(pixKey);

    await this.pixKeyClaimRepository.update(pixKeyClaim);

    this.eventEmitter.canceledPixKey(pixKey);

    this.logger.debug('Portability confirmed process.', { pixKey });

    return pixKey;
  }
}
