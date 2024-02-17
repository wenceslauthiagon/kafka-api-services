import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixKey,
  PixKeyRepository,
  ClaimReasonType,
  KeyState,
  PixKeyReasonType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  PixKeyGateway,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  DeletePixKeyPspRequest,
  CreatePixKeyPspRequest,
  ClosingClaimPspRequest,
  PixKeyInvalidStateException,
  PixKeyClaimNotFoundException,
} from '@zro/pix-keys/application';

export class HandleClaimClosingPixKeyEventUseCase {
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
      context: HandleClaimClosingPixKeyEventUseCase.name,
    });
  }

  /**
   * Close a claim. Confirm key donation.
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
    if (pixKey.state === KeyState.CLAIM_CLOSED) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.CLAIM_CLOSING) {
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

    // If the key is in Zrobank, finish the ownership process.
    if (pixKeyOwnedByThirdPerson) {
      this.logger.info('PixKey owned by third person.', {
        pixKey: pixKeyOwnedByThirdPerson,
      });

      // Sanity check.
      if (pixKeyOwnedByThirdPerson.state !== KeyState.OWNERSHIP_WAITING) {
        throw new PixKeyInvalidStateException(pixKeyOwnedByThirdPerson);
      }

      // Delete the current key that is being left on pspGateway.
      const bodyDelete: DeletePixKeyPspRequest = {
        key: pixKey.key,
        keyType: pixKey.type,
        reason: PixKeyReasonType.USER_REQUESTED,
        ispb: this.ispb,
        pixKeyId: pixKey.id,
      };

      const deletedPixKey = await this.pixKeyGateway.deletePixKey(bodyDelete);

      this.logger.debug('PixKey deleted in psp.', { pixKey: deletedPixKey });

      // Create the third key that is pending on pspGateway.
      const bodyCreate: CreatePixKeyPspRequest = {
        key: pixKeyOwnedByThirdPerson.key,
        keyType: pixKeyOwnedByThirdPerson.type,
        personType: pixKeyOwnedByThirdPerson.personType,
        document: pixKeyOwnedByThirdPerson.document,
        name: pixKeyOwnedByThirdPerson.name,
        branch: pixKeyOwnedByThirdPerson.branch,
        accountNumber: pixKeyOwnedByThirdPerson.accountNumber,
        accountOpeningDate: pixKeyOwnedByThirdPerson.accountOpeningDate,
        tradeName: pixKey.tradeName,
        reason: PixKeyReasonType.USER_REQUESTED,
        accountType: AccountType.CACC,
        ispb: this.ispb,
        pixKeyId: pixKeyOwnedByThirdPerson.id,
      };

      const createdPixKey = await this.pixKeyGateway.createPixKey(bodyCreate);

      this.logger.debug('PixKey created in psp.', { pixKey: createdPixKey });

      // Change status for key owned by third person.
      pixKeyOwnedByThirdPerson.state = KeyState.OWNERSHIP_READY;

      // Update pixKey state.
      await this.pixKeyRepository.update(pixKeyOwnedByThirdPerson);

      // Fire event.
      this.eventEmitter.ownershipReadyPixKey(pixKeyOwnedByThirdPerson);
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

      const body: ClosingClaimPspRequest = {
        key: pixKey.key,
        keyType: pixKey.type,
        document: claim.document,
        reason,
        claimId: claim.id,
        ispb: this.ispb,
      };

      const closingPixKey = await this.pixKeyGateway.closingClaim(body);

      this.logger.debug('Confirm claim donation.', { pixKey: closingPixKey });
    }

    pixKey.state = KeyState.CLAIM_CLOSED;

    await this.pixKeyRepository.update(pixKey);

    // Fire ClaimClosedPixKeyEvent
    this.eventEmitter.claimClosedPixKey(pixKey);

    this.logger.debug('Claim closed pix key.', { pixKey });

    return pixKey;
  }
}
