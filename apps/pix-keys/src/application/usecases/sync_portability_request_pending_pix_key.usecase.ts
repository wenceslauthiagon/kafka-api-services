import { Logger } from 'winston';
import { MissingDataException, getMoment } from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKey,
  PixKeyClaimRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { PixKeyEventEmitter } from '@zro/pix-keys/application';

export class SyncPortabilityRequestPendingPixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param pixKeyClaimRepository Pix key claim repository.
   * @param eventEmitter Pix key event emitter.
   * @param timestamp The timestamp when the key is considered expired.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly pixKeyClaimRepository: PixKeyClaimRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
    private readonly timestamp: number,
  ) {
    this.logger = logger.child({
      context: SyncPortabilityRequestPendingPixKeyUseCase.name,
    });
  }

  /**
   * Sync portability request pending key.
   *
   * @returns {PixKey[]} Keys found.
   */
  async execute(reason: ClaimReasonType): Promise<PixKey[]> {
    // Data input check
    if (!reason) {
      throw new MissingDataException(['Reason']);
    }

    // Search for pixKeys that be in portability request pending.
    const pixKeys = await this.pixKeyRepository.getByState(
      KeyState.PORTABILITY_REQUEST_PENDING,
    );

    this.logger.debug('Found pix keys.', { pixKeys });

    const claimOpeningDateFilter = getMoment()
      .subtract(this.timestamp, 'seconds')
      .toDate();

    for (const pixKey of pixKeys) {
      if (!pixKey.claim?.id) {
        this.logger.error('Pix key claim not found.', { pixKey });
        continue;
      }

      const claim = await this.pixKeyClaimRepository.getByIdAndLessOpeningDate(
        pixKey.claim.id,
        claimOpeningDateFilter,
      );

      this.logger.debug('Found pix key claim.', { claim });

      if (claim) {
        // Key is ready to be claimed on DICT.
        pixKey.state = KeyState.PORTABILITY_REQUEST_CONFIRM_OPENED;

        // Update pixKey state
        await this.pixKeyRepository.update(pixKey);

        // Fire PortabilityRequestConfirmOpenedPixKeyEvent
        this.eventEmitter.portabilityRequestConfirmOpenedPixKey(pixKey, reason);

        this.logger.debug('Portability request confirm opened.', { pixKey });
      }
    }

    this.logger.debug('Pix keys sent.');

    return pixKeys;
  }
}
