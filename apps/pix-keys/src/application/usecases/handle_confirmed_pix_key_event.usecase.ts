import { Logger } from 'winston';
import {
  isUUID,
  InvalidDataFormatException,
  MissingDataException,
} from '@zro/common';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyReasonType,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  PixKeyGateway,
  PixKeyEventEmitter,
  CreatePixKeyPspRequest,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyOwnedBySamePersonPspException,
  PixKeyOwnedByThirdPersonPspException,
} from '@zro/pix-keys/application';

export class HandleConfirmedPixKeyEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param eventEmitter Pix key event emitter.
   * @param pspGateway PSP gateway instance.
   * @param ispb Zro Bank's default ispb code.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
    private readonly pspGateway: PixKeyGateway,
    private readonly ispb: string,
  ) {
    this.logger = logger.child({
      context: HandleConfirmedPixKeyEventUseCase.name,
    });
  }

  /**
   * Handler triggered when key was added successfully to DICT.
   *
   * @param id Pix key id.
   * @returns Key created.
   * @throws {MissingDataException} Thrown when user forgets to pass key id or key value for EVP key type.
   * @throws {InvalidDataFormatException} Thrown when key value is not formatted as UUID for EVP key type.
   * @throws {PixKeyNotFoundException} Thrown when key id was not found.
   * @throws {PixKeyInvalidStateException} Thrown when key state is not CONFIRMED.
   */
  async execute(id: string): Promise<PixKey> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search Pix Key
    const pixKey = await this.pixKeyRepository.getByIdAndStateIsNotCanceled(id);

    this.logger.debug('Found PixKey.', { pixKey });

    if (!pixKey) {
      throw new PixKeyNotFoundException({ id });
    }

    // Indeponent retry
    if (pixKey.state === KeyState.ADD_KEY_READY) {
      return pixKey;
    }

    // Only confirmed keys can go to READY state.
    if (pixKey.state !== KeyState.CONFIRMED) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    // Only EMAIL and PHONE can be claimed.
    if (pixKey.isSendCodeType()) {
      // Check if key is owned by Zrobank.
      let foundReadyKeys =
        await this.pixKeyRepository.getByKeyAndStateIsNotCanceled(pixKey.key);

      this.logger.debug('Found pix keys with the same key.', {
        pixKeys: foundReadyKeys,
      });

      // Remove this key
      foundReadyKeys = foundReadyKeys.filter((key) => key.id !== pixKey.id);

      // Remove canceled keys
      foundReadyKeys = foundReadyKeys.filter((key) => !key.isCanceledState());

      // Remove pending keys
      foundReadyKeys = foundReadyKeys.filter(
        (key) => key.state !== KeyState.PENDING,
      );

      // Get a ready keys if it exists.
      const readyKeys = foundReadyKeys.filter((key) => key.isReadyState());

      // Get not ready keys if it exists.
      const notReadyKeys = foundReadyKeys.filter((key) => !key.isReadyState());

      // If there are many ready keys.
      if (notReadyKeys.length || readyKeys.length > 1) {
        this.logger.warn('Ownership conflict.', { pixKey, foundReadyKeys });

        // Set key as conflict.
        pixKey.state = KeyState.OWNERSHIP_CONFLICT;

        // Save pix key
        await this.pixKeyRepository.update(pixKey);

        // Fire OwnershipConflictPixKeyEvent
        this.eventEmitter.ownershipConflictPixKey(pixKey);

        return pixKey;
      }

      // Get first pix key with different state.
      const [pixKeyOwnedByThirdPerson] = readyKeys;

      // If the key is in Zrobank, start the ownership process.
      if (pixKeyOwnedByThirdPerson) {
        this.logger.info('PixKey owned by third person.', {
          pixKey: pixKeyOwnedByThirdPerson,
        });

        return this.addOwnershipPendingPixKey(pixKey);
      }
    }

    // If the key is in another ISPB, call the pspGateway.
    const body: CreatePixKeyPspRequest = {
      key: pixKey.key,
      keyType: pixKey.type,
      personType: pixKey.personType,
      document: pixKey.document,
      name: pixKey.name,
      branch: pixKey.branch,
      accountNumber: pixKey.accountNumber,
      accountOpeningDate: pixKey.accountOpeningDate,
      tradeName: pixKey.tradeName,
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: this.ispb,
      pixKeyId: pixKey.id,
    };

    try {
      const addedPixKey = await this.pspGateway.createPixKey(body);

      this.logger.debug('Added PixKey.', { pixKey: addedPixKey });

      const { key } = addedPixKey;

      // Sanity check.
      if (pixKey.type === KeyType.EVP) {
        if (!key) {
          throw new MissingDataException(['Pix key']);
        }
        if (!isUUID(key)) {
          throw new InvalidDataFormatException(['Pix key']);
        }
        // EVP keys are created by DICT.
        pixKey.key = key;
      }

      // Key is ready to be used.
      pixKey.state = KeyState.ADD_KEY_READY;

      // Save pix key
      await this.pixKeyRepository.update(pixKey);

      // Fire ReadyPixKeyEvent
      this.eventEmitter.addReadyPixKey(pixKey);

      this.logger.debug('Added ready PixKey.', { pixKey });

      return pixKey;
    } catch (error) {
      if (error instanceof PixKeyOwnedByThirdPersonPspException) {
        this.logger.info('PixKey owned by third person.', { pixKey });

        return this.addOwnershipPendingPixKey(pixKey);
      } else if (error instanceof PixKeyOwnedBySamePersonPspException) {
        this.logger.info('PixKey owned by same person in another ISPB.', {
          pixKey,
        });

        return this.addPortabilityPendingPixKey(pixKey);
      } else {
        throw error;
      }
    }
  }

  /**
   * Key is owned by user in another ISPB.
   *
   * @param pixKey The key.
   * @return Key in a portability pending state.
   */
  private async addPortabilityPendingPixKey(pixKey: PixKey): Promise<PixKey> {
    // Key is waiting for user to start portability process
    pixKey.state = KeyState.PORTABILITY_PENDING;

    // Save pix key
    await this.pixKeyRepository.update(pixKey);

    // Fire PendingPortabilityPixKeyEvent
    this.eventEmitter.portabilityPendingPixKey(pixKey);

    this.logger.debug('Added pending portability pix key.', { pixKey });

    return pixKey;
  }

  /**
   * Key is owned by third party.
   *
   * @param pixKey The key.
   * @return Key in a ownership pending state.
   */
  private async addOwnershipPendingPixKey(pixKey: PixKey): Promise<PixKey> {
    // Key is waiting for user to start ownership process
    pixKey.state = KeyState.OWNERSHIP_PENDING;

    // Save pix key
    await this.pixKeyRepository.update(pixKey);

    // Fire PendingOwnershipPixKeyEvent
    this.eventEmitter.ownershipPendingPixKey(pixKey);

    this.logger.debug('Added pending ownership pix key.', { pixKey });

    return pixKey;
  }
}
