import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyGateway,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyEventEmitter,
  CreateOwnershipClaimPspRequest,
} from '@zro/pix-keys/application';

export class HandleOwnershipOpenedPixKeyEventUseCase {
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
      context: HandleOwnershipOpenedPixKeyEventUseCase.name,
    });
  }

  /**
   * Create an ownership claim.
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
    if (pixKey.state === KeyState.OWNERSHIP_STARTED) {
      return pixKey;
    }

    if (pixKey.state !== KeyState.OWNERSHIP_OPENED) {
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
      (item) => item.state !== KeyState.OWNERSHIP_OPENED,
    );

    // If the key is in Zrobank, start the ownership process.
    if (pixKeyOwnedByThirdPerson) {
      this.logger.info('PixKey owned by third person.', {
        pixKey: pixKeyOwnedByThirdPerson,
      });

      // If the key is an intermediate state, the flow can't continue.
      if (
        !pixKeyOwnedByThirdPerson.isReadyState() &&
        !pixKeyOwnedByThirdPerson.isCanceledState()
      ) {
        throw new PixKeyInvalidStateException(pixKeyOwnedByThirdPerson);
      }

      // Change status for key owned by third person.
      pixKeyOwnedByThirdPerson.state = KeyState.CLAIM_PENDING;

      // Update pixKey state.
      await this.pixKeyRepository.update(pixKeyOwnedByThirdPerson);

      // Fire event.
      this.eventEmitter.claimPendingPixKey(pixKeyOwnedByThirdPerson);

      pixKey.state = KeyState.OWNERSHIP_WAITING;

      // Fire ownershipWaitingPixKey.
      this.eventEmitter.ownershipWaitingPixKey(pixKey);

      this.logger.debug('Ownership waiting pix key.', { pixKey });
    }
    // If the key is in another ISPB, call the pspGateway.
    else {
      const body: CreateOwnershipClaimPspRequest = {
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

      const startedPixKey = await this.pixKeyGateway.createOwnershipClaim(body);

      this.logger.debug('Ownership started PixKey.', { pixKey: startedPixKey });

      pixKey.claim = startedPixKey.claim;

      pixKey.state = KeyState.OWNERSHIP_STARTED;

      // Fire OwnershipStartedPixKeyEvent
      this.eventEmitter.ownershipStartedPixKey(pixKey);

      this.logger.debug('Ownership started pix key.', { pixKey });
    }

    await this.pixKeyRepository.update(pixKey);

    return pixKey;
  }
}
