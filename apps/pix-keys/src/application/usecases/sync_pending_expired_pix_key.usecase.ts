import { Logger } from 'winston';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import { PixKeyEventEmitter } from '@zro/pix-keys/application';
import { getMoment } from '@zro/common';

export class SyncPendingExpiredPixKeyUseCase {
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
      context: SyncPendingExpiredPixKeyUseCase.name,
    });
  }

  /**
   * Sync expired pending key.
   *
   * @returns {PixKey[]} Keys found.
   */
  async execute(): Promise<PixKey[]> {
    const states = [KeyState.PENDING];
    const createdAtFilter = getMoment()
      .subtract(this.timestamp, 'seconds')
      .toDate();

    // Search for pixKeys with createdAt less than timestamp
    const pixKeys = await this.pixKeyRepository.getByLessUpdatedAtAndStateIn(
      createdAtFilter,
      states,
    );

    this.logger.debug('Found pix keys.', { pixKeys });

    // Fire PendingExpiredPixKeyEvent
    pixKeys.forEach((pixKey) => this.eventEmitter.pendingExpiredPixKey(pixKey));

    this.logger.debug('Pix keys sent.');

    return pixKeys;
  }
}
