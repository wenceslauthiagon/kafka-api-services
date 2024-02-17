import { Logger } from 'winston';
import {
  createRandomCode,
  MissingDataException,
  NullPointerException,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  KeyType,
  PixKeyRepository,
  PixKeyVerificationRepository,
} from '@zro/pix-keys/domain';
import {
  NotificationService,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyInvalidTypeException,
} from '@zro/pix-keys/application';

export class SendCodePixKeyUseCase {
  private readonly RANDOM_CODE_LENGTH = 5;

  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    private readonly pixKeyVerificationRepository: PixKeyVerificationRepository,
    private readonly notificationService: NotificationService,
    private readonly emailTag: string,
    private readonly emailFrom: string,
    private readonly smsTag: string,
  ) {
    this.logger = logger.child({ context: SendCodePixKeyUseCase.name });
  }

  /**
   * Send verification code.
   *
   * @param user Keys' owner.
   * @param id The key id
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixKeyNotFoundException} Thrown when key id was not found.
   * @throws {PixKeyInvalidStateException} Thrown when key state is not valid.
   */
  async execute(user: User, id: string): Promise<void> {
    // Data input check
    if (!user || !id) {
      throw new MissingDataException([
        ...(!user ? ['User'] : []),
        ...(!id ? ['ID'] : []),
      ]);
    }

    // Search pixKey
    const pixKey =
      await this.pixKeyRepository.getByUserAndIdAndStateIsNotCanceled(user, id);

    this.logger.debug('Found pix key.', { pixKey });

    if (!pixKey) {
      throw new PixKeyNotFoundException({ id });
    }

    // Sanity check.
    // Only keys in PENDING (new keys) or CLAIM_PENDING (claim process) states can send code.
    if (!pixKey.isSendCodeState()) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    // Sanity check.
    // Only EMAIL and PHONE keys can send code.
    if (!pixKey.isSendCodeType()) {
      throw new PixKeyInvalidTypeException(pixKey);
    }

    // Sanity check.
    // At this point, a PixKey should have key and code.
    if (!pixKey.key || !pixKey.code) {
      throw new NullPointerException(
        `PixKey (id=${pixKey.id}) does not have a valid key or code.`,
      );
    }

    await this.pixKeyVerificationRepository.deleteByPixKey(pixKey);

    pixKey.code = createRandomCode(this.RANDOM_CODE_LENGTH);

    await this.pixKeyRepository.update(pixKey);

    // Check key type and...
    if (pixKey.type === KeyType.EMAIL) {
      // ...send code by e-mail.
      await this.notificationService.sendEmailCode(
        user,
        pixKey,
        this.emailFrom,
        this.emailTag,
      );
    } else {
      // ... or send code by SMS.
      await this.notificationService.sendSmsCode(user, pixKey, this.smsTag);
    }

    this.logger.debug('Scheduled send code for key.', { pixKey });
  }
}
