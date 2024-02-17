import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
} from '@zro/pix-keys/application';

export class HandlePortabilityRequestCancelStartedPixKeyEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandlePortabilityRequestCancelStartedPixKeyEventUseCase.name,
    });
  }

  /**
   * Update the portability state to ready.
   *
   * @param {UUID} id The key id
   * @returns {PixKey} Key updated.
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
    const pixKey = await this.pixKeyRepository.getByIdAndStateIsNotCanceled(id);

    this.logger.debug('Found PixKey.', { pixKey });

    if (!pixKey) {
      throw new PixKeyNotFoundException({ id });
    }

    // Indeponent retry
    if (pixKey.state === KeyState.READY) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.PORTABILITY_REQUEST_CANCEL_STARTED) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    pixKey.state = KeyState.READY;

    await this.pixKeyRepository.update(pixKey);

    this.eventEmitter.readyPixKey(pixKey);

    this.logger.debug('Portability canceled process.', { pixKey });

    return pixKey;
  }
}
