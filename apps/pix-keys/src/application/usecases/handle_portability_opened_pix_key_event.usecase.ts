import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyGateway,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyEventEmitter,
  CreatePortabilityClaimPspRequest,
} from '@zro/pix-keys/application';

export class HandlePortabilityOpenedPixKeyEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param eventEmitter Pix key event emitter.
   * @param pixKeyGateway PSP gateway instance.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
    private readonly pixKeyGateway: PixKeyGateway,
    private readonly ispb: string,
  ) {
    this.logger = logger.child({
      context: HandlePortabilityOpenedPixKeyEventUseCase.name,
    });
  }

  /**
   * Create an portability claim.
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
    const pixKey = await this.pixKeyRepository.getByIdAndStateIsNotCanceled(id);

    this.logger.debug('Found pix key.', { pixKey });

    if (!pixKey) {
      throw new PixKeyNotFoundException({ id });
    }

    // Indeponent retry
    if (pixKey.state === KeyState.PORTABILITY_STARTED) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.PORTABILITY_OPENED) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    const body: CreatePortabilityClaimPspRequest = {
      key: pixKey.key,
      keyType: pixKey.type,
      personType: pixKey.personType,
      document: pixKey.document,
      name: pixKey.name,
      tradeName: pixKey.tradeName,
      branch: pixKey.branch,
      accountNumber: pixKey.accountNumber,
      accountOpeningDate: pixKey.accountOpeningDate,
      ispb: this.ispb,
      pixKeyId: pixKey.id,
    };

    const startedPixKey = await this.pixKeyGateway.createPortabilityClaim(body);

    this.logger.debug('Portability started PixKey.', { pixKey: startedPixKey });

    pixKey.state = KeyState.PORTABILITY_STARTED;
    pixKey.claim = startedPixKey.claim;

    await this.pixKeyRepository.update(pixKey);

    // Fire PortabilityStartedPixKeyEvent
    this.eventEmitter.portabilityStartedPixKey(pixKey);

    this.logger.debug('Portability started pix key.', { pixKey });

    return pixKey;
  }
}
