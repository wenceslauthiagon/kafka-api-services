import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { MissingDataException, ForbiddenException } from '@zro/common';
import { User } from '@zro/users/domain';
import { PixKey } from '@zro/pix-keys/domain';
import {
  QrCodeStatic,
  QrCodeStaticEntity,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import {
  AddressNotFoundException,
  OnboardingNotFoundException,
} from '@zro/users/application';
import {
  UserService,
  PixKeyService,
  QrCodeStaticEventEmitter,
} from '@zro/pix-payments/application';

export class CreateQrCodeStaticUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository QrCodeStatic repository.
   * @param userService User service gateway.
   * @param pixKeyService Pix key service gateway.
   * @param eventEmitter QrCodeStatic event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: QrCodeStaticRepository,
    private readonly userService: UserService,
    private readonly pixKeyService: PixKeyService,
    private readonly eventEmitter: QrCodeStaticEventEmitter,
  ) {
    this.logger = logger.child({ context: CreateQrCodeStaticUseCase.name });
  }

  /**
   * Create QrCodeStatic.
   *
   * @param id QrCodeStatic' id.
   * @param user QrCodeStatic' owner.
   * @param pixKey QrCodeStatic key.
   * @param [documentValue] QrCodeStatic value.
   * @param [summary] QrCodeStatic summary.
   * @param [description] QrCodeStatic description.
   * @param [ispbWithdrawal] QrCodeStatic ispbWithdrawal.
   * @param [expirationDate] QrCodeStatic expirationDate.
   * @param [payableManyTimes] QrCodeStatic payableManyTimes.
   * @returns QrCodeStatic created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {ForbiddenException} Thrown when userId is not the qrCodeStatic owner.
   */
  async execute(
    id: string,
    user: User,
    pixKey: PixKey,
    documentValue?: number,
    summary?: string,
    description?: string,
    ispbWithdrawal?: string,
    expirationDate?: Date,
    payableManyTimes = true,
  ): Promise<QrCodeStatic> {
    // Data input check
    if (!id || !user?.uuid || (!pixKey?.id && !pixKey?.key)) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user?.uuid ? ['User'] : []),
        ...(!pixKey?.id && !pixKey?.key ? ['PixKey ID And Key'] : []),
      ]);
    }
    // If it can be paid just one time, then it must have an expiration date.
    if (!payableManyTimes && !isDefined(expirationDate)) {
      throw new MissingDataException(['expirationDate']);
    }

    // Check if QrCodeStatic's ID is available
    const checkQrCodeStatic = await this.repository.getById(id);

    this.logger.debug('Check if QrCodeStatic exists.', {
      qrCodeStatic: checkQrCodeStatic,
    });

    if (checkQrCodeStatic) {
      if (checkQrCodeStatic.user.uuid === user.uuid) {
        return checkQrCodeStatic;
      } else {
        throw new ForbiddenException();
      }
    }

    // Search pixKey by id or key
    let pixKeyFound: PixKey;

    if (pixKey.key) {
      pixKeyFound = await this.pixKeyService.getPixKeyByKeyAndUser(
        pixKey,
        user,
      );
    } else if (pixKey.id) {
      pixKeyFound = await this.pixKeyService.getPixKeyByIdAndUser(pixKey, user);
    }

    this.logger.debug('Found pixKey.', { pixKey: pixKeyFound });

    if (!pixKeyFound) {
      throw new PixKeyNotFoundException(pixKey);
    }

    if (!pixKeyFound.isReadyState()) {
      throw new PixKeyInvalidStateException(pixKeyFound);
    }

    // Search user's onboarding
    const onboardingFound =
      await this.userService.getOnboardingByUserAndStatusIsFinished(user);

    this.logger.debug('Found onboarding.', { onboarding: onboardingFound });

    if (!onboardingFound) {
      throw new OnboardingNotFoundException({ user });
    }
    if (!onboardingFound.fullName) {
      throw new MissingDataException(['FullName']);
    }
    if (!onboardingFound.address) {
      throw new AddressNotFoundException();
    }

    // Search user's address
    const addressFound = await this.userService.getAddressById({
      id: onboardingFound.address.id,
      user,
    });

    this.logger.debug('Found address.', { address: addressFound });

    if (!addressFound?.city) {
      throw new AddressNotFoundException(onboardingFound.address);
    }

    const newQrCodeStatic = new QrCodeStaticEntity({
      id,
      user,
      documentValue,
      summary,
      description,
      pixKey: pixKeyFound,
      recipientCity: addressFound.city,
      recipientName: onboardingFound.fullName,
      state: QrCodeStaticState.PENDING,
      ispbWithdrawal,
      expirationDate,
      payableManyTimes,
    });

    // Save QrCodeStatic
    const qrCodeStatic = await this.repository.create(newQrCodeStatic);

    // Fire PendingQrCodeStaticEvent
    this.eventEmitter.pendingQrCodeStatic(qrCodeStatic);

    this.logger.debug('Added QrCodeStatic.', { qrCodeStatic });

    return qrCodeStatic;
  }
}
