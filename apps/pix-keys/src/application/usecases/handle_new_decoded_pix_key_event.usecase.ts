import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { MissingDataException, getMoment } from '@zro/common';
import {
  DecodedPixKey,
  DecodedPixKeyState,
  UserPixKeyDecodeLimit,
  UserPixKeyDecodeLimitEntity,
  UserPixKeyDecodeLimitRepository,
} from '@zro/pix-keys/domain';
import { PersonType } from '@zro/users/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  DecodedPixKeyInvalidStateException,
  UserService,
} from '@zro/pix-keys/application';

/**
 * Handle new decoded pix key events by updating its user's bucket.
 */
export class HandleNewDecodedPixKeyEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userPixKeyDecodeLimitRepository User limit decoded pix key repository.
   * @param userService User service.
   * @param naturalPersonBucketLimit Natural person type decoded pix key limit.
   * @param legalPersonBucketLimit Legal person type decoded pix key limit.
   * @param temporalIncrementBucket Decoded pix key temporal bucket increment.
   * @param temporalIncrementBucketInterval Decoded pix key temporal bucket increment interval.
   * @param validTryDecrementOrIncrementBucket Decoded pix key valid try bucket decrement.
   * @param invalidTryDecrementBucket Decoded pix key invalid try bucket decrement.
   */
  constructor(
    private logger: Logger,
    private readonly userPixKeyDecodeLimitRepository: UserPixKeyDecodeLimitRepository,
    private readonly userService: UserService,
    private readonly naturalPersonBucketLimit: number,
    private readonly legalPersonBucketLimit: number,
    private readonly temporalIncrementBucket: number,
    private readonly temporalIncrementBucketInterval: number,
    private readonly validTryDecrementOrIncrementBucket: number,
    private readonly invalidTryDecrementBucket: number,
  ) {
    this.logger = logger.child({
      context: HandleNewDecodedPixKeyEventUseCase.name,
    });
  }

  async execute(decodedPixKey: DecodedPixKey): Promise<void> {
    // Data input check
    if (!decodedPixKey?.id || !decodedPixKey?.user?.uuid) {
      throw new MissingDataException([
        ...(!decodedPixKey?.id ? ['Decoded Pix Key ID'] : []),
        ...(!decodedPixKey?.user?.uuid ? ['User ID'] : []),
      ]);
    }

    // TODO: Add check to just get user if decodedPixKey personType has no value.
    // Search user
    const userFound = await this.userService.getUserByUuid(decodedPixKey.user);

    this.logger.debug('User found.', { user: userFound });

    if (!userFound) {
      throw new UserNotFoundException(decodedPixKey.user);
    }

    if (!userFound.type) {
      throw new MissingDataException(['User type']);
    }

    decodedPixKey.personType = userFound.type;

    let userPixKeyDecodeLimit =
      await this.getUserLimitDecodedPixKey(decodedPixKey);

    switch (decodedPixKey.state) {
      case DecodedPixKeyState.ERROR:
        userPixKeyDecodeLimit = this.handleInvalidDecodedPixKey(
          userPixKeyDecodeLimit,
        );
        break;
      case DecodedPixKeyState.PENDING:
        userPixKeyDecodeLimit = this.handleValidDecodedPixKey(
          userPixKeyDecodeLimit,
        );
        break;
      case DecodedPixKeyState.CONFIRMED:
        userPixKeyDecodeLimit = this.handleConfirmedDecodedPixKey(
          userPixKeyDecodeLimit,
          decodedPixKey,
        );
        break;
      default:
        throw new DecodedPixKeyInvalidStateException(decodedPixKey);
    }

    userPixKeyDecodeLimit.lastDecodedCreatedAt = getMoment().toDate();

    await this.userPixKeyDecodeLimitRepository.createOrUpdate(
      userPixKeyDecodeLimit,
    );

    this.logger.debug('User limit for decoding pix keys created or updated.', {
      userPixKeyDecodeLimit,
    });
  }

  /**
   * Get user's pix key decode limit.
   *
   * @param user Limit owner.
   * @returns The user's pix key decode limit found.
   */
  private async getUserLimitDecodedPixKey(
    decodedPixKey: DecodedPixKey,
  ): Promise<UserPixKeyDecodeLimit> {
    // Get user limit.
    const userPixKeyDecodeLimitFound =
      await this.userPixKeyDecodeLimitRepository.getByUser(decodedPixKey.user);

    this.logger.debug('User limit for decoding pix keys found.', {
      userPixKeyDecodeLimit: userPixKeyDecodeLimitFound,
    });

    // If found, refresh it and return.
    if (userPixKeyDecodeLimitFound) {
      return this.refreshUserLimitDecodedPixKey(
        userPixKeyDecodeLimitFound,
        decodedPixKey,
      );
    }

    // If not found, create a new one.
    const userPixKeyDecodeLimit = new UserPixKeyDecodeLimitEntity({
      id: uuidV4(),
      user: decodedPixKey.user,
      limit:
        decodedPixKey.personType === PersonType.NATURAL_PERSON
          ? this.naturalPersonBucketLimit
          : this.legalPersonBucketLimit,
    });

    this.logger.debug('New user limit for decoding pix key.', {
      userPixKeyDecodeLimit,
    });

    return userPixKeyDecodeLimit;
  }

  /**
   * Refresh user's pix key decode limit according to its last decoded created at.
   * @param userPixKeyDecodeLimit The UserPixKeyDecodeLimit to be refreshed.
   * @param decodedPixKey Decoded pix key.
   * @returns The user's pix key decode limit refreshed.
   */
  private refreshUserLimitDecodedPixKey(
    userPixKeyDecodeLimit: UserPixKeyDecodeLimit,
    decodedPixKey: DecodedPixKey,
  ): UserPixKeyDecodeLimit {
    // If there is no lastDecodedCreatedAt, initialize a new limit.
    if (!userPixKeyDecodeLimit.lastDecodedCreatedAt) {
      userPixKeyDecodeLimit.limit =
        decodedPixKey.personType === PersonType.NATURAL_PERSON
          ? this.naturalPersonBucketLimit
          : this.legalPersonBucketLimit;

      this.logger.debug('User limit for decoding pix key initialized.', {
        limit: userPixKeyDecodeLimit.limit,
      });

      return userPixKeyDecodeLimit;
    }

    const nowSeconds = getMoment().unix();
    const lastCreationSeconds = getMoment(
      userPixKeyDecodeLimit.lastDecodedCreatedAt,
    ).unix();

    const totalSeconds = nowSeconds - lastCreationSeconds;
    const increments =
      Math.floor(totalSeconds / this.temporalIncrementBucketInterval) *
      this.temporalIncrementBucket;

    userPixKeyDecodeLimit.limit += increments;
    userPixKeyDecodeLimit.limit = this.validateNewLimit(
      userPixKeyDecodeLimit.limit,
      decodedPixKey,
    );

    this.logger.debug('User limit for decoding pix key refreshed.', {
      userPixKeyDecodeLimit,
    });

    return userPixKeyDecodeLimit;
  }

  /**
   * Validate the new user limit decoded pix key's limit.
   * @param newLimit New limit to be validated.
   * @param decodedPixKey Decoded pix key.
   */
  private validateNewLimit(
    newLimit: number,
    decodedPixKey: DecodedPixKey,
  ): number {
    // The limit should not pass the maximum limit.
    if (
      decodedPixKey.personType === PersonType.NATURAL_PERSON &&
      newLimit > this.naturalPersonBucketLimit
    ) {
      newLimit = this.naturalPersonBucketLimit;
    } else if (
      decodedPixKey.personType === PersonType.LEGAL_PERSON &&
      newLimit > this.legalPersonBucketLimit
    ) {
      newLimit = this.legalPersonBucketLimit;
    }

    return newLimit;
  }

  /**
   * Handles an invalid decoded pix key.
   * @param userPixKeyDecodeLimit Invalid UserPixKeyDecodeLimit to be considered on the bucket calibration.
   */
  private handleInvalidDecodedPixKey(
    userPixKeyDecodeLimit: UserPixKeyDecodeLimit,
  ): UserPixKeyDecodeLimit {
    this.logger.debug('Handle invalid decoded pix key.', {
      userPixKeyDecodeLimit,
    });

    userPixKeyDecodeLimit.limit -= this.invalidTryDecrementBucket;

    return userPixKeyDecodeLimit;
  }

  /**
   * Handles an valid decoded pix key.
   * @param userPixKeyDecodeLimit Valid UserPixKeyDecodeLimit to be considered on the bucket calibration.
   */
  private handleValidDecodedPixKey(
    userPixKeyDecodeLimit: UserPixKeyDecodeLimit,
  ): UserPixKeyDecodeLimit {
    this.logger.debug('Handle valid decoded pix key.', {
      userPixKeyDecodeLimit,
    });

    userPixKeyDecodeLimit.limit -= this.validTryDecrementOrIncrementBucket;

    return userPixKeyDecodeLimit;
  }

  /**
   * Handles an confirmed decoded pix key.
   * @param userPixKeyDecodeLimit Confirmed UserPixKeyDecodeLimit to be considered on the bucket calibration.
   */
  private handleConfirmedDecodedPixKey(
    userPixKeyDecodeLimit: UserPixKeyDecodeLimit,
    decodedPixKey: DecodedPixKey,
  ): UserPixKeyDecodeLimit {
    this.logger.debug('Handle confirmed decoded pix key.', {
      userPixKeyDecodeLimit,
    });

    userPixKeyDecodeLimit.limit += this.validTryDecrementOrIncrementBucket;
    userPixKeyDecodeLimit.limit = this.validateNewLimit(
      userPixKeyDecodeLimit.limit,
      decodedPixKey,
    );

    return userPixKeyDecodeLimit;
  }
}
