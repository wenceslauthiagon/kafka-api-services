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
  DeniedClaimPspRequest,
} from '@zro/pix-keys/application';

export class HandleOwnershipCancelingPixKeyEventUseCase {
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
      context: HandleOwnershipCancelingPixKeyEventUseCase.name,
    });
  }

  /**
   * Denied a claim. Close the claim and cancel the key.
   *
   * @param id The key id
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
    if (pixKey.state === KeyState.OWNERSHIP_CANCELED) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.OWNERSHIP_CANCELING) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    // Check if key is owned by Zrobank.
    const foundReadyKeys =
      await this.pixKeyRepository.getByKeyAndStateIsNotCanceled(pixKey.key);

    this.logger.debug('Found pix keys with the same key.', {
      pixKeys: foundReadyKeys,
    });

    // Sanity check. If there are more than 2 keys, this is an error.
    if (foundReadyKeys.length > 2) {
      this.logger.error('Multiple keys found.', { pixKeys: foundReadyKeys });
      // TODO: Notify IT team
    }

    // Get first pix key with different state.
    const pixKeyOwnedByThirdPerson = foundReadyKeys.find(
      (key) => key.id !== pixKey.id,
    );

    // If the key is in Zrobank, start the ownership process.
    if (pixKeyOwnedByThirdPerson) {
      this.logger.info('PixKey owned by third person.', {
        pixKey: pixKeyOwnedByThirdPerson,
      });

      // Sanity check.
      if (pixKeyOwnedByThirdPerson.state !== KeyState.CLAIM_PENDING) {
        throw new PixKeyInvalidStateException(pixKeyOwnedByThirdPerson);
      }

      // Change status for key owned by third person
      pixKeyOwnedByThirdPerson.state = KeyState.READY;

      // Update pixKey state.
      await this.pixKeyRepository.update(pixKeyOwnedByThirdPerson);

      // Fire event.
      this.eventEmitter.readyPixKey(pixKeyOwnedByThirdPerson);
    }
    // If the key is in another ISPB, call the pspGateway
    else {
      if (!pixKey.claim?.id) {
        throw new MissingDataException(['Pix Key Claim ID']);
      }

      const body: DeniedClaimPspRequest = {
        key: pixKey.key,
        keyType: pixKey.type,
        document: pixKey.document,
        claimId: pixKey.claim.id,
        ispb: this.ispb,
        isClaimOwner: true,
        reason,
      };

      const deniedPixKey = await this.pixKeyGateway.deniedClaim(body);

      this.logger.debug('Ownership canceling PixKey.', {
        pixKey: deniedPixKey,
      });
    }

    pixKey.state = KeyState.OWNERSHIP_CANCELED;

    await this.pixKeyRepository.update(pixKey);

    // Fire ReadyPixKeyEvent
    this.eventEmitter.ownershipCanceledPixKey(pixKey);

    this.logger.debug('Ownership canceled.', { pixKey });

    return pixKey;
  }
}
