import { Logger } from 'winston';
import { createHash } from 'crypto';
import { isDefined } from 'class-validator';
import {
  MissingDataException,
  ForbiddenException,
  isCpf,
  isUUID,
  isCnpj,
  isEmail,
  isMobilePhone,
  formatPhone,
  getMoment,
} from '@zro/common';
import {
  DecodedPixKey,
  DecodedPixKeyRepository,
  PixKeyRepository,
  PixKeyReadyStates,
  DecodedPixKeyEntity,
  DecodedPixKeyState,
  KeyType,
  UserPixKeyDecodeLimitRepository,
  DecodedPixKeyCacheRepository,
  UserPixKeyDecodeLimit,
} from '@zro/pix-keys/domain';
import { PersonType, User, UserEntity } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  UserService,
  InvalidEmailFormatException,
  InvalidPhoneNumberFormatException,
  PixKeyNotFoundExceptionPspException,
  DecodedPixKeyPspGateway,
  DecodedPixKeyOwnedByUserException,
  DecodedPixKeyEventEmitter,
  MaxDecodePixKeyRequestsPerDayReachedException,
  InvalidCnpjFormatException,
  InvalidCpfFormatException,
  InvalidEvpFormatException,
  DecodedPixKeyNotFoundException,
} from '@zro/pix-keys/application';

type DecodePixKeyHashInformation = Pick<DecodedPixKey, 'key'>;

/**
 * Create a decoded PIX key. Online search PIX key in our partner or in a local database.
 */
export class CreateDecodedPixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param decodedPixKeyRepository Decoded pix key repository.
   * @param pixKeyRepository Pix key repository.
   * @param eventEmitter Pix key event emitter.
   * @param userService User service.
   * @param decodedPixKeyGateway Pix key gateway.
   * @param userPixKeyDecodeLimitRepository User Pix key decode limit repository.
   * @param ispb Zro Bank's default ispb.
   * @param naturalPersonBucketLimit Natural person type decoded pix key limit.
   * @param legalPersonBucketLimit Legal person type decoded pix key limit.
   * @param temporalIncrementBucket Decoded pix key temporal bucket increment.
   * @param temporalIncrementBucketInterval Decoded pix key temporal bucket increment interval.
   */
  constructor(
    private logger: Logger,
    private readonly decodedPixKeyRepository: DecodedPixKeyRepository,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly decodedPixKeyCacheRepository: DecodedPixKeyCacheRepository,
    private readonly eventEmitter: DecodedPixKeyEventEmitter,
    private readonly userService: UserService,
    private readonly decodedPixKeyGateway: DecodedPixKeyPspGateway,
    private readonly userPixKeyDecodeLimitRepository: UserPixKeyDecodeLimitRepository,
    private readonly ispb: string,
    private readonly naturalPersonBucketLimit: number,
    private readonly legalPersonBucketLimit: number,
    private readonly temporalIncrementBucketInterval: number,
    private readonly temporalIncrementBucket: number,
  ) {
    this.logger = logger.child({ context: CreateDecodedPixKeyUseCase.name });
  }

  async execute(
    id: string,
    user: User,
    key: string,
    type: KeyType,
  ): Promise<DecodedPixKey> {
    // Data input check
    if (!id || !user?.uuid || !key || !type) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user?.uuid ? ['User ID'] : []),
        ...(!key ? ['Key'] : []),
        ...(!type ? ['Type'] : []),
      ]);
    }

    if (type === KeyType.CNPJ && !isCnpj(key)) {
      throw new InvalidCnpjFormatException(key);
    }
    if (type === KeyType.CPF && !isCpf(key)) {
      throw new InvalidCpfFormatException(key);
    }
    if (type === KeyType.EMAIL && !isEmail(key)) {
      throw new InvalidEmailFormatException(key);
    }
    if (type === KeyType.EVP && !isUUID(key)) {
      throw new InvalidEvpFormatException(key);
    }
    if (type === KeyType.PHONE) {
      key = formatPhone(key);
      if (!isMobilePhone(key)) throw new InvalidPhoneNumberFormatException(key);
    }

    // Indepotent retry
    const decodedPixKey = await this.decodedPixKeyRepository.getById(id);

    this.logger.debug('Decoded pix key found.', { decodedPixKey });

    if (decodedPixKey) {
      if (decodedPixKey.user.uuid !== user.uuid) {
        throw new ForbiddenException();
      }

      return decodedPixKey;
    }

    // Search user.
    const payerUser = await this.userService.getUserByUuid(user);

    this.logger.debug('Payer user found.', { user: payerUser });

    // Sanity check.
    if (!payerUser?.active) {
      this.logger.error('Payer user not found.', { user });
      throw new UserNotFoundException(user);
    }

    // Get the UserLimitDecodedPixKey's limit.
    const limit = await this.getUserLimitDecodedPixKey(
      new UserEntity({ uuid: payerUser.uuid, type: payerUser.type }),
    );

    this.logger.debug('User pix key decode limit found.', { limit });

    // If the pix key decode limit is not sufficient, an exception is returned.
    if (limit <= 0) {
      throw new MaxDecodePixKeyRequestsPerDayReachedException(limit, {
        id,
        key,
      });
    }

    // First search on local keys.
    return this.decodeLocalPixKey(id, user, key, payerUser.document, type);
  }

  /**
   * Get user's pix key decode limit.
   *
   * @param user Limit owner.
   * @returns The user's pix key decode limit found.
   */
  private async getUserLimitDecodedPixKey(user: User): Promise<number> {
    const userPixKeyDecodeLimit =
      await this.userPixKeyDecodeLimitRepository.getByUser(user);

    this.logger.debug('User limit for decoding pix key found.', {
      userPixKeyDecodeLimit,
    });

    // If found, refresh it and return.
    if (isDefined(userPixKeyDecodeLimit?.limit)) {
      return this.refreshUserLimitDecodedPixKey(userPixKeyDecodeLimit, user);
    }

    // If not found, start a new one.
    return user.type === PersonType.NATURAL_PERSON
      ? this.naturalPersonBucketLimit
      : this.legalPersonBucketLimit;
  }

  /**
   * Refresh user's pix key decode limit according to its last decoded created at.
   * @param userPixKeyDecodeLimit The UserPixKeyDecodeLimit to be refreshed.
   * @param user Pix key decode limit's user.
   * @returns The user's pix key decode limit refreshed.
   */
  private refreshUserLimitDecodedPixKey(
    userPixKeyDecodeLimit: UserPixKeyDecodeLimit,
    user: User,
  ): number {
    // If there is no lastDecodedCreatedAt, initialize a new limit.
    if (!userPixKeyDecodeLimit.lastDecodedCreatedAt) {
      return user.type === PersonType.NATURAL_PERSON
        ? this.naturalPersonBucketLimit
        : this.legalPersonBucketLimit;
    }

    const nowSeconds = getMoment().unix();
    const lastCreationSeconds = getMoment(
      userPixKeyDecodeLimit.lastDecodedCreatedAt,
    ).unix();

    const totalSeconds = nowSeconds - lastCreationSeconds;
    const increments =
      Math.floor(totalSeconds / this.temporalIncrementBucketInterval) *
      this.temporalIncrementBucket;

    return userPixKeyDecodeLimit.limit + increments;
  }

  /**
   * Decode a PIX key owned by Zrobank.
   *
   * @param id Decoded key ID.
   * @param user User requester.
   * @param key The key.
   * @param userDocument Payer document (cpf or cnpj).
   * @param [type] Key type.
   * @returns Decoded pix key.
   */
  async decodeLocalPixKey(
    id: string,
    user: User,
    key: string,
    userDocument: string,
    type?: KeyType,
  ): Promise<DecodedPixKey> {
    // Data input check
    if (!id || !user || !key || !userDocument) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user ? ['User'] : []),
        ...(!key ? ['Key'] : []),
        ...(!userDocument ? ['User document'] : []),
      ]);
    }

    // Check if key is owned by Zrobank.
    const pixKeys =
      await this.pixKeyRepository.getByKeyAndStateIsNotCanceled(key);

    this.logger.debug('Found pix keys.', { pixKeys });

    const foundReadyKeys = pixKeys.filter((keyFilter) =>
      PixKeyReadyStates.includes(keyFilter.state),
    );

    this.logger.debug('Found pix keys in state READY.', { foundReadyKeys });

    // Found any key?
    if (!foundReadyKeys?.length) {
      this.logger.debug('Key is not in state READY, trying remote key.');

      // If not try to decode a remote key.
      return this.decodeRemotePixKey(id, user, key, userDocument, type);
    }

    // Sanity check.
    if (foundReadyKeys.length > 1) {
      this.logger.error('Multiple READY keys found.', { foundReadyKeys });
      // TODO: Notify IT team
    }

    // Get first pix key.
    const [pixKey] = foundReadyKeys;

    // Check if user is trying to decode his own key.
    if (pixKey.user.uuid === user.uuid) {
      this.logger.debug('User is trying to decode his own key.', { pixKey });
      throw new DecodedPixKeyOwnedByUserException(user, pixKey);
    }

    // Get found key owner.
    const ownerUser = await this.userService.getUserByUuid(pixKey.user);

    this.logger.debug('Found pix key user.', { ownerUser });

    // If user is not found or is not active.
    if (!ownerUser?.active) {
      this.logger.debug(
        'Owner user not active or not found, trying remote key.',
      );

      // Try remote key.
      return this.decodeRemotePixKey(id, user, key, userDocument, type);
    }

    // Build a decoded key.
    const decodedPixKey = new DecodedPixKeyEntity({
      id,
      key,
      type: pixKey.type,
      personType: pixKey.personType,
      document: pixKey.document,
      name: pixKey.name,
      tradeName: pixKey.tradeName,
      accountNumber: pixKey.accountNumber,
      accountType: AccountType.CACC,
      branch: pixKey.branch,
      ispb: this.ispb,
      activeAccount: ownerUser.active,
      accountOpeningDate: pixKey.accountOpeningDate,
      keyCreationDate: pixKey.createdAt,
      state: DecodedPixKeyState.PENDING,
      user,
    });

    // Store decoded key.
    await this.decodedPixKeyRepository.create(decodedPixKey);

    this.logger.debug('Created local decoded key.', { decodedPixKey });

    // Fire PendingDecodedPixKeyEvent.
    this.eventEmitter.pendingDecodedPixKey(decodedPixKey);

    return decodedPixKey;
  }

  /**
   * Decode a PIX key owned by Bacen.
   *
   * @param id Decoded key ID.
   * @param user User requester.
   * @param key Zrobank keys found.
   * @param userDocument Payer document (cpf or cnpj).
   * @param [type] Key type.
   * @returns Decoded pix key.
   */
  async decodeRemotePixKey(
    id: string,
    user: User,
    key: string,
    userDocument: string,
    type?: KeyType,
  ): Promise<DecodedPixKey> {
    // Data input check
    if (!id || !user || !key || !userDocument) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user ? ['User'] : []),
        ...(!key ? ['Key'] : []),
        ...(!userDocument ? ['User document'] : []),
      ]);
    }

    // Check decode in cache.
    const hashInformation: DecodePixKeyHashInformation = { key };
    const hash = createHash('sha1')
      .update(JSON.stringify(hashInformation))
      .digest('base64');

    const checkDecodedPixKeyInCache = await this.getSameDecodedPixKeyInCache(
      id,
      user,
      hash,
    );
    if (checkDecodedPixKeyInCache) {
      return checkDecodedPixKeyInCache;
    }

    try {
      this.logger.info('Sending remote pix key to pspGateway.', { key });

      const remoteKey = await this.decodedPixKeyGateway.decodePixKey({
        key,
        ispb: this.ispb,
        userDocument,
        keyType: type,
      });

      this.logger.info('PspGateway pix key response.', { remoteKey });

      // Build a decoded key.
      const decodedPixKey = new DecodedPixKeyEntity({
        id,
        type: remoteKey.type,
        key: remoteKey.key,
        personType: remoteKey.personType,
        document: remoteKey.document,
        name: remoteKey.name,
        tradeName: remoteKey.tradeName,
        accountNumber: remoteKey.accountNumber,
        accountType: remoteKey.accountType,
        branch: remoteKey.branch,
        ispb: remoteKey.ispb,
        activeAccount: remoteKey.activeAccount,
        accountOpeningDate: remoteKey.accountOpeningDate,
        keyCreationDate: remoteKey.keyCreationDate,
        keyOwnershipDate: remoteKey.keyOwnershipDate,
        claimRequestDate: remoteKey.claimRequestDate,
        endToEndId: remoteKey.endToEndId,
        cidId: remoteKey.cidId,
        dictAccountId: remoteKey.dictAccountId,
        state: DecodedPixKeyState.PENDING,
        user,
      });

      // Store decoded key.
      await this.decodedPixKeyRepository.create(decodedPixKey);

      this.logger.debug('Created remote decoded pix key.', { decodedPixKey });

      // Store decoded key in cache.
      await this.decodedPixKeyCacheRepository.createHash(hash, decodedPixKey);

      this.logger.debug('DecodedPixKey hash saved.', { hash });

      // Fire PendingDecodedPixKeyEvent.
      this.eventEmitter.pendingDecodedPixKey(decodedPixKey);

      return decodedPixKey;
    } catch (error) {
      if (error instanceof PixKeyNotFoundExceptionPspException) {
        this.logger.debug('Remote key not found.', { key, error });
        throw new DecodedPixKeyNotFoundException({ key });
      }

      // TODO: Notify IT team
      this.logger.error('Unexpected error.', { error });
      throw error;
    }
  }

  private async getSameDecodedPixKeyInCache(
    id: string,
    user: User,
    hash: string,
  ): Promise<DecodedPixKey> {
    // Seach for same decodedPixKey in caches.
    const decodedPixKeyFound =
      await this.decodedPixKeyCacheRepository.getByHash(hash);

    this.logger.debug('DecodedPixKey hash found in cache.', {
      decodedPixKeyFound,
    });

    if (!decodedPixKeyFound) {
      return null;
    }

    // Build a decoded key.
    const decodedPixKey = new DecodedPixKeyEntity({
      id,
      type: decodedPixKeyFound.type,
      key: decodedPixKeyFound.key,
      personType: decodedPixKeyFound.personType,
      document: decodedPixKeyFound.document,
      name: decodedPixKeyFound.name,
      tradeName: decodedPixKeyFound.tradeName,
      accountNumber: decodedPixKeyFound.accountNumber,
      accountType: decodedPixKeyFound.accountType,
      branch: decodedPixKeyFound.branch,
      ispb: decodedPixKeyFound.ispb,
      activeAccount: decodedPixKeyFound.activeAccount,
      accountOpeningDate: decodedPixKeyFound.accountOpeningDate,
      keyCreationDate: decodedPixKeyFound.keyCreationDate,
      state: DecodedPixKeyState.PENDING,
      user,
    });

    // Store decoded key in database.
    await this.decodedPixKeyRepository.create(decodedPixKey);

    this.logger.debug('DecodedPixKey saved.', { decodedPixKey });

    // Fire PendingDecodedPixKeyEvent.
    this.eventEmitter.pendingDecodedPixKey(decodedPixKey);

    return decodedPixKey;
  }
}
