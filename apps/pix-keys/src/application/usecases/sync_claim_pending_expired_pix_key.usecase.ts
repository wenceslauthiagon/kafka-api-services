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

export class SyncClaimPendingExpiredPixKeyUseCase {
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
      context: SyncClaimPendingExpiredPixKeyUseCase.name,
    });
  }

  /**
   * Sync expired claim pending key.
   *
   * @returns Keys found.
   */
  async execute(reason: ClaimReasonType): Promise<PixKey[]> {
    // Data input check
    if (!reason) {
      throw new MissingDataException(['Reason']);
    }

    // Search for pixKeys that be in claim pending.
    const pixKeys = await this.pixKeyRepository.getByState(
      KeyState.CLAIM_PENDING,
    );

    this.logger.debug('Found pix keys.', { pixKeys });

    const claimOpeningDateFilter = getMoment()
      .subtract(this.timestamp, 'seconds')
      .toDate();

    for (const pixKey of pixKeys) {
      // If key has claim, check it is expired.
      if (pixKey.claim?.id) {
        const claim =
          await this.pixKeyClaimRepository.getByIdAndLessOpeningDate(
            pixKey.claim.id,
            claimOpeningDateFilter,
          );

        this.logger.debug('Found pix key claim.', { claim });

        if (claim) {
          // Fire ClaimPendingExpiredPixKeyEvent
          this.eventEmitter.claimPendingExpiredPixKey(pixKey, reason);
        }
      } else if (
        getMoment(pixKey.updatedAt).isSameOrBefore(claimOpeningDateFilter)
      ) {
        // If key has no claim (it is P2P claim), check if updatedAt date is expired and
        // fire ClaimPendingExpiredPixKeyEvent
        this.eventEmitter.claimPendingExpiredPixKey(pixKey, reason);
      }
    }

    this.logger.debug('Pix keys sent.');

    return pixKeys;
  }
}
