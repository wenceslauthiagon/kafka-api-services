import { Logger } from 'winston';
import { getMoment } from '@zro/common';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import { PixKeyEventEmitter } from '@zro/pix-keys/application';

export class SyncOwnershipPendingExpiredPixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param eventEmitter Pix key event emitter.
   * @param timestamp The timestamp when the key is considered expired.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
    private readonly timestamp: number,
  ) {
    this.logger = logger.child({
      context: SyncOwnershipPendingExpiredPixKeyUseCase.name,
    });
  }

  /**
   * Sync expired owner pending key.
   *
   * @returns Keys found.
   */
  async execute(): Promise<PixKey[]> {
    const states = [KeyState.OWNERSHIP_PENDING];
    const updatedAtFilter = getMoment()
      .subtract(this.timestamp, 'seconds')
      .toDate();

    // Search for pixKeys with updatedAt less than timestamp
    const pixKeys = await this.pixKeyRepository.getByLessUpdatedAtAndStateIn(
      updatedAtFilter,
      states,
    );

    this.logger.debug('Found pix keys.', { pixKeys });

    // Fire OwnershipPendingExpiredPixKeyEvent
    pixKeys.forEach((pixKey) =>
      this.eventEmitter.ownershipPendingExpiredPixKey(pixKey),
    );

    this.logger.debug('Pix keys sent.');

    return pixKeys;
  }
}
