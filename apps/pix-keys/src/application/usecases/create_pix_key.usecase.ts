import { Logger } from 'winston';
import {
  createRandomCode,
  isCpf,
  isEmail,
  isMobilePhone,
  MissingDataException,
  ForbiddenException,
} from '@zro/common';
import { User, PersonType } from '@zro/users/domain';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyEntity,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  UserService,
  PixKeyEventEmitter,
  MaxNumberOfPixKeysReachedException,
  PixKeyUnsupportedCnpjTypeException,
  InvalidPhoneNumberFormatException,
  InvalidEmailFormatException,
  PixKeyAlreadyCreatedException,
  InvalidDocumentFormatException,
} from '@zro/pix-keys/application';

export class CreatePixKeyUseCase {
  private readonly RANDOM_CODE_LENGTH = 5;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param userService User service gateway.
   * @param eventEmitter Pix key event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly userService: UserService,
    private readonly eventEmitter: PixKeyEventEmitter,
    private readonly naturalPersonMaxNumberOfKeys: number,
    private readonly legalPersonMaxNumberOfKeys: number,
  ) {
    this.logger = logger.child({ context: CreatePixKeyUseCase.name });
  }

  /**
   * Get random code.
   *
   * @returns {String} Random code created.
   */
  private getRandomCode = (): string =>
    createRandomCode(this.RANDOM_CODE_LENGTH);

  /**
   * Create key.
   *
   * @param {String} id Keys' id.
   * @param {User} user Keys' owner.
   * @param {String} type The key type.
   * @param {String} key Key value. Default null.
   * @returns {PixKey} Key found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {ForbiddenException} Thrown when userId is not the key owner.
   * @throws {InvalidDataFormatException} Thrown when type or key has invalid format.
   * @throws {UserNotFoundException} Thrown when user tries to add a key but he is canceled state.
   * @throws {OnboardingNotFoundException} Thrown when user tries to add a key but he has not already finished onboarding.
   */
  async execute(
    id: string,
    user: User,
    type: KeyType,
    key?: string,
  ): Promise<PixKey> {
    // Data input check
    if (!id || !user || !type) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user ? ['User'] : []),
        ...(!type ? ['Type'] : []),
      ]);
    }

    if (type === KeyType.CNPJ) {
      throw new PixKeyUnsupportedCnpjTypeException(['CNPJ']);
    }
    if (type === KeyType.EMAIL && !isEmail(key)) {
      throw new InvalidEmailFormatException(key);
    }
    if (type === KeyType.PHONE && !isMobilePhone(key)) {
      throw new InvalidPhoneNumberFormatException(key);
    }

    // Check if Key's ID is available
    const checkPixKey =
      await this.pixKeyRepository.getByIdAndStateIsNotCanceled(id);

    this.logger.debug('Check if pix key exists.', { pixKey: checkPixKey });

    if (checkPixKey) {
      if (checkPixKey.user.uuid !== user.uuid) {
        throw new ForbiddenException();
      }

      return checkPixKey;
    }

    // Search user
    const userFound = await this.userService.getUserByUuid(user);

    this.logger.debug('User found.', { user: userFound });

    if (!userFound) {
      throw new UserNotFoundException(user);
    }

    if (!userFound.document || !userFound.fullName) {
      throw new MissingDataException([
        ...(!userFound.document ? ['Document'] : []),
        ...(!userFound.fullName ? ['FullName'] : []),
      ]);
    }

    Object.assign(user, userFound);

    // Get finished onboarding
    const onboarding =
      await this.userService.getOnboardingByUserAndStatusIsFinished(user);

    this.logger.debug('Found onboarding.', { onboarding });

    if (!onboarding) {
      throw new OnboardingNotFoundException({ user });
    }

    if (!onboarding.accountNumber || !onboarding.branch) {
      throw new MissingDataException([
        ...(!onboarding.accountNumber ? ['AccountNumber'] : []),
        ...(!onboarding.branch ? ['Branch'] : []),
      ]);
    }

    // Check document format is valid.
    if (type === KeyType.CPF && !isCpf(key)) {
      throw new InvalidDocumentFormatException(key);
    }

    // Check if max number of keys was reached.
    const numberOfKeys =
      await this.pixKeyRepository.countByUserAndStateIsNotCanceled(user);

    this.logger.debug('Found number of keys.', { keys: numberOfKeys });

    if (
      user.type === PersonType.NATURAL_PERSON &&
      numberOfKeys >= this.naturalPersonMaxNumberOfKeys
    ) {
      throw new MaxNumberOfPixKeysReachedException(
        this.naturalPersonMaxNumberOfKeys,
      );
    } else if (numberOfKeys >= this.legalPersonMaxNumberOfKeys) {
      throw new MaxNumberOfPixKeysReachedException(
        this.legalPersonMaxNumberOfKeys,
      );
    }

    // FIXME: Should work with LEGAL too.
    const newPixKey = new PixKeyEntity({
      id,
      type,
      key: null,
      state: KeyState.CONFIRMED,
      personType: user.type,
      branch: onboarding.branch,
      accountNumber: onboarding.accountNumber,
      accountOpeningDate: onboarding.updatedAt,
      document: user.document.replace(/\D/g, ''),
      name: user.fullName,
      user,
    });

    if ([KeyType.PHONE, KeyType.EMAIL].includes(type)) {
      // Set key
      newPixKey.key = key;
      // Set state
      newPixKey.state = KeyState.PENDING;
      // Set random code
      newPixKey.code = this.getRandomCode();
    } else if (type === KeyType.CPF) {
      // Set key
      newPixKey.key = newPixKey.document;
    }

    // Check if user is trying to add same key again.
    if (type !== KeyType.EVP) {
      const foundKey =
        await this.pixKeyRepository.getByUserAndKeyAndStateIsNotCanceled(
          user,
          newPixKey.key,
        );

      this.logger.debug('Found pix key.', { pixKey: foundKey });

      if (foundKey) {
        throw new PixKeyAlreadyCreatedException({ id: foundKey.id });
      }
    }

    // Save pix key
    const pixKey = await this.pixKeyRepository.create(newPixKey);

    if (pixKey.state === KeyState.CONFIRMED) {
      // Fire ConfirmedPixKeyEvent
      this.eventEmitter.confirmedPixKey(pixKey);
    } else {
      // Fire PendingPixKeyEvent
      this.eventEmitter.pendingPixKey(pixKey);
    }

    this.logger.debug('Added pix key.', { pixKey });

    return pixKey;
  }
}
