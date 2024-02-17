import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyGateway,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyEventEmitter,
  DeletePixKeyPspRequest,
} from '@zro/pix-keys/application';

export class HandleDeletingPixKeyEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param eventEmitter Pix key event emitter.
   * @param pspGateway PSP gateway instance.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
    private readonly pspGateway: PixKeyGateway,
    private readonly ispb: string,
  ) {
    this.logger = logger.child({
      context: HandleDeletingPixKeyEventUseCase.name,
    });
  }

  /**
   * Delete the key by id.
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

    this.logger.debug('Found pix key.', { pixKey });

    if (!pixKey) {
      throw new PixKeyNotFoundException({ id });
    }

    // Indeponent retry
    if (pixKey.state === KeyState.DELETED) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.DELETING) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    const body: DeletePixKeyPspRequest = {
      key: pixKey.key,
      keyType: pixKey.type,
      reason: pixKey.deletedByReason,
      ispb: this.ispb,
      pixKeyId: pixKey.id,
    };

    const deletedPixKey = await this.pspGateway.deletePixKey(body);

    this.logger.debug('Deleted PixKey.', { pixKey: deletedPixKey });

    pixKey.state = KeyState.DELETED;
    pixKey.deletedAt = new Date();

    await this.pixKeyRepository.update(pixKey);

    // Fire DeletedPixKeyEvent
    this.eventEmitter.deletedPixKey(pixKey);

    this.logger.debug('Deleted pix key.', { pixKey });

    return pixKey;
  }
}
