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
  DeniedClaimPspRequest,
  PixKeyClaimNotFoundException,
} from '@zro/pix-keys/application';

export class HandleClaimDeniedPixKeyEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param eventEmitter Pix key event emitter.
   * @param pixKeyGateway PSP gateway instance.
   * @param ispb ispb
   * @param pixKeyClaimRepository Pix key claims repository.
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
      context: HandleClaimDeniedPixKeyEventUseCase.name,
    });
  }

  /**
   * Denied a claim. Don't donate the key.
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
    if (pixKey.state === KeyState.READY) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.CLAIM_DENIED) {
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
      if (pixKeyOwnedByThirdPerson.state !== KeyState.OWNERSHIP_WAITING) {
        throw new PixKeyInvalidStateException(pixKeyOwnedByThirdPerson);
      }

      // Change status for key owned by third person
      pixKeyOwnedByThirdPerson.state = KeyState.OWNERSHIP_CANCELED;

      // Update pixKey state.
      await this.pixKeyRepository.update(pixKeyOwnedByThirdPerson);

      // Fire event.
      this.eventEmitter.ownershipCanceledPixKey(pixKeyOwnedByThirdPerson);
    }
    // If the key is in another ISPB, call the pspGateway
    else {
      if (!pixKey.claim?.id) {
        throw new MissingDataException(['Pix Key Claim ID']);
      }

      const claim = await this.pixKeyClaimRepository.getById(pixKey.claim.id);

      this.logger.debug('Pix key claim found.', { claim });

      if (!claim?.document) {
        throw new PixKeyClaimNotFoundException(pixKey.claim);
      }

      const body: DeniedClaimPspRequest = {
        key: pixKey.key,
        keyType: pixKey.type,
        document: claim.document,
        claimId: claim.id,
        ispb: this.ispb,
        isClaimOwner: false,
        reason,
      };

      const deniedPixKey = await this.pixKeyGateway.deniedClaim(body);

      this.logger.debug('Claim denied PixKey.', { pixKey: deniedPixKey });
    }

    pixKey.state = KeyState.READY;

    await this.pixKeyRepository.update(pixKey);

    // Fire ReadyPixKeyEvent
    this.eventEmitter.readyPixKey(pixKey);

    this.logger.debug('Claim denied pix key.', { pixKey });

    return pixKey;
  }
}
