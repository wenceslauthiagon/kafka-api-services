import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKey,
  PixKeyRepository,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyGateway,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyEventEmitter,
  CancelPortabilityClaimPspRequest,
  PixKeyClaimNotFoundException,
} from '@zro/pix-keys/application';

export class HandlePortabilityRequestCancelOpenedPixKeyEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param eventEmitter Pix key event emitter.
   * @param pixKeyGateway PSP gateway instance.
   * @param ispb ispb
   * @param pixKeyClaimRepository Pix key claim repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
    private readonly pixKeyGateway: PixKeyGateway,
    private readonly ispb: string,
    private readonly pixKeyClaimRepository: PixKeyClaimRepository,
  ) {
    this.logger = logger.child({
      context: HandlePortabilityRequestCancelOpenedPixKeyEventUseCase.name,
    });
  }

  /**
   * Create a portability cancel request claim.
   *
   * @param id The key id.
   * @param reason The claim reason.
   * @returns Key updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixKeyNotFoundException} Thrown when key id was not found.
   * @throws {PixKeyInvalidStateException} Thrown when key state is not valid.
   */
  async execute(id: string, reason: ClaimReasonType): Promise<PixKey> {
    // Data input check
    if (!id || !reason) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!reason ? ['Reason'] : []),
      ]);
    }

    // Search pixKey
    const pixKey = await this.pixKeyRepository.getByIdAndStateIsNotCanceled(id);

    this.logger.debug('Found pix key.', { pixKey });

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

    if (!pixKey.claim?.id) {
      throw new MissingDataException(['Pix Key Claim ID']);
    }

    const claim = await this.pixKeyClaimRepository.getById(pixKey.claim.id);

    this.logger.debug('Pix key claim found.', { claim });

    if (!claim?.document) {
      throw new PixKeyClaimNotFoundException(pixKey.claim);
    }

    const body: CancelPortabilityClaimPspRequest = {
      key: pixKey.key,
      keyType: pixKey.type,
      document: claim.document,
      claimId: claim.id,
      ispb: this.ispb,
      isClaimOwner: false,
      reason,
    };

    const canceledPixKey =
      await this.pixKeyGateway.cancelPortabilityClaim(body);

    this.logger.debug('Portability request cancel started PixKey.', {
      pixKey: canceledPixKey,
    });

    pixKey.state = KeyState.PORTABILITY_REQUEST_CANCEL_STARTED;

    await this.pixKeyRepository.update(pixKey);

    this.eventEmitter.portabilityRequestCancelStartedPixKey(pixKey);

    this.logger.debug('Portability request cancel started pix key.', {
      pixKey,
    });

    return pixKey;
  }
}
