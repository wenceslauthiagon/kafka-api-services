import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  KeyState,
  PixKeyHistory,
  PixKeyHistoryEntity,
  PixKeyHistoryRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { PixKeyNotFoundException } from '@zro/pix-keys/application';

export class HandleHistoryPixKeyEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param pixKeyHistoryRepository Pix key history repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly pixKeyHistoryRepository: PixKeyHistoryRepository,
  ) {
    this.logger = logger.child({
      context: HandleHistoryPixKeyEventUseCase.name,
    });
  }

  /**
   * Handler triggered when change state for a key
   *
   * @param {String} id Pix key id.
   * @returns {PixKeyHistory} Key created.
   * @throws {MissingDataException} Thrown when user forgets to pass key id or key value for EVP key type.
   * @throws {PixKeyNotFoundException} Thrown when key id was not found.
   */
  async execute(id: string, state: KeyState): Promise<PixKeyHistory> {
    // Data input check
    if (!id || !state) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!state ? ['State'] : []),
      ]);
    }

    // Search Pix Key
    const pixKey = await this.pixKeyRepository.getById(id);

    this.logger.debug('Found PixKey.', { pixKey });

    if (!pixKey) {
      throw new PixKeyNotFoundException({ id });
    }

    const newPixKeyHistory = new PixKeyHistoryEntity({
      pixKey,
      state,
      createdAt: new Date(),
      updatedAt: null,
    });

    const pixKeyHistory =
      await this.pixKeyHistoryRepository.create(newPixKeyHistory);

    this.logger.debug('Created PixKeyHistory.', { pixKeyHistory });

    return pixKeyHistory;
  }
}
