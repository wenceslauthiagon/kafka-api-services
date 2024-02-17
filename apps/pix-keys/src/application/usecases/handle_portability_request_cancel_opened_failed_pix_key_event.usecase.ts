import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyEventEmitter,
} from '@zro/pix-keys/application';

export class HandlePortabilityRequestCancelOpenedFailedPixKeyEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param eventEmitter Pix key event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
  ) {
    this.logger = logger.child({
      context:
        HandlePortabilityRequestCancelOpenedFailedPixKeyEventUseCase.name,
    });
  }

  /**
   * Handler triggered when an error is thrown.
   *
   * @param {String} id Pix key id.
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
    if (pixKey.state === KeyState.PORTABILITY_REQUEST_CANCEL_STARTED) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.PORTABILITY_REQUEST_CANCEL_OPENED) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    pixKey.state = KeyState.ERROR;

    await this.pixKeyRepository.update(pixKey);

    // Fire ErrorPixKeyEvent
    this.eventEmitter.errorPixKey(pixKey);

    this.logger.debug('Portability cancel request process failed.', { pixKey });

    return pixKey;
  }
}
