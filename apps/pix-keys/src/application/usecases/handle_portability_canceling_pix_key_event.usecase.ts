import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyGateway,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyEventEmitter,
  CancelPortabilityClaimPspRequest,
} from '@zro/pix-keys/application';

export class HandlePortabilityCancelingPixKeyEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param eventEmitter Pix key event emitter.
   * @param pixKeyGateway PSP gateway instance.
   * @param ispb ispb
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
    private readonly pixKeyGateway: PixKeyGateway,
    private readonly ispb: string,
  ) {
    this.logger = logger.child({
      context: HandlePortabilityCancelingPixKeyEventUseCase.name,
    });
  }

  /**
   * Denied a claim. Close the portabilty and cancel the key.
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
    if (pixKey.state === KeyState.PORTABILITY_CANCELED) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.PORTABILITY_CANCELING) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    if (!pixKey.claim?.id) {
      throw new MissingDataException(['Pix Key Claim ID']);
    }

    const body: CancelPortabilityClaimPspRequest = {
      key: pixKey.key,
      keyType: pixKey.type,
      document: pixKey.document,
      claimId: pixKey.claim.id,
      ispb: this.ispb,
      isClaimOwner: true,
      reason,
    };

    const canceledPixKey =
      await this.pixKeyGateway.cancelPortabilityClaim(body);

    this.logger.debug('Portability canceling PixKey.', {
      pixKey: canceledPixKey,
    });

    pixKey.state = KeyState.PORTABILITY_CANCELED;

    await this.pixKeyRepository.update(pixKey);

    this.eventEmitter.portabilityCanceledPixKey(pixKey);

    this.logger.debug('Portability canceled.', { pixKey });

    return pixKey;
  }
}
