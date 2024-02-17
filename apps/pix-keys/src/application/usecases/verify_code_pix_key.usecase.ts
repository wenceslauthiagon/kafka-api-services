import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixKey,
  PixKeyRepository,
  PixKeyVerificationRepository,
  PixKeyVerificationState,
  PixKeyVerificationEntity,
  KeyState,
  ClaimReasonType,
} from '@zro/pix-keys/domain';
import { User } from '@zro/users/domain';
import {
  PixKeyEventEmitter,
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
  PixKeyVerificationOverflowException,
} from '@zro/pix-keys/application';

export class VerifyCodePixKeyUseCase {
  /**
   * Local logger instance.
   */
  private logger: Logger;

  constructor(
    logger: Logger,
    private pixKeyRepository: PixKeyRepository,
    private pixKeyVerificationRepository: PixKeyVerificationRepository,
    private readonly eventEmitter: PixKeyEventEmitter,
    private numberOfRetries: number = 3,
  ) {
    this.logger = logger.child({ context: VerifyCodePixKeyUseCase.name });
  }

  async execute(
    user: User,
    id: string,
    code: string,
    reason: ClaimReasonType,
  ): Promise<PixKey> {
    // Data input check
    if (!user || !id || !code) {
      throw new MissingDataException([
        ...(!user ? ['User'] : []),
        ...(!id ? ['id'] : []),
        ...(!code ? ['code'] : []),
        ...(!reason ? ['reason'] : []),
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
    // Only keys in PENDING or CLAIM_PENDING (claim process) states can verify code.
    if (!pixKey.isVerifiedCodeState()) {
      throw new PixKeyInvalidStateException(pixKey);
    }

    // Check how many verfication tries user already done.
    const pastRetries =
      await this.pixKeyVerificationRepository.countByPixKey(pixKey);

    // User cannot retry?
    if (pastRetries >= this.numberOfRetries) {
      throw new PixKeyVerificationOverflowException(pixKey, pastRetries);
    }

    const verification = new PixKeyVerificationEntity({
      pixKey,
      code,
      state: PixKeyVerificationState.OK,
    });

    // Check if pix code is the same as the param code
    if (!pixKey.isVerifiedCodeValue(code)) {
      // Verification failed.
      verification.state = PixKeyVerificationState.FAILED;

      // Is last retry?
      if (pastRetries == this.numberOfRetries - 1) {
        switch (pixKey.state) {
          case KeyState.PENDING:
            // User failed to verify key. Now, key is going to be canceled.
            pixKey.state = KeyState.NOT_CONFIRMED;
            break;
          case KeyState.CLAIM_PENDING:
            // User failed to verify key. Now, key is going to retry.
            pixKey.state = KeyState.CLAIM_NOT_CONFIRMED;
            break;
        }
      }
    } else {
      // Verfication passed.
      switch (pixKey.state) {
        case KeyState.PENDING:
          pixKey.state = KeyState.CONFIRMED;
          break;
        case KeyState.CLAIM_PENDING:
          pixKey.state = KeyState.CLAIM_DENIED;
          break;
      }
    }

    // Store retry.
    await this.pixKeyVerificationRepository.create(verification);

    // Store new key state.
    await this.pixKeyRepository.update(pixKey);

    switch (pixKey.state) {
      case KeyState.NOT_CONFIRMED:
        this.eventEmitter.notConfirmedPixKey(pixKey);
        break;
      case KeyState.CLAIM_DENIED:
        this.eventEmitter.claimDeniedPixKey(pixKey, reason);
        break;
      case KeyState.CONFIRMED:
        this.eventEmitter.confirmedPixKey(pixKey);
        break;
      case KeyState.CLAIM_NOT_CONFIRMED:
        this.eventEmitter.claimNotConfirmedPixKey(pixKey);
        break;
    }

    return pixKey;
  }
}
