import { Logger } from 'winston';
import {
  MissingDataException,
  ForbiddenException,
  getMoment,
} from '@zro/common';
import {
  QrCodeDynamic,
  QrCodeDynamicEntity,
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import {
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import {
  UserNotFoundException,
  OnboardingNotFoundException,
  AddressNotFoundException,
} from '@zro/users/application';
import {
  UserService,
  PixKeyService,
  QrCodeDynamicEventEmitter,
} from '@zro/pix-payments/application';

export class CreateQrCodeDynamicUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository QrCodeDynamic repository.
   * @param userService User service gateway.
   * @param pixKeyService Pix key service gateway.
   * @param eventEmitter QrCodeDynamic event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: QrCodeDynamicRepository,
    private readonly userService: UserService,
    private readonly pixKeyService: PixKeyService,
    private readonly eventEmitter: QrCodeDynamicEventEmitter,
  ) {
    this.logger = logger.child({ context: CreateQrCodeDynamicUseCase.name });
  }

  /**
   * Create a txid of the UUID without traces.
   * @param id
   * @returns txid
   */
  private createTxId(id: string): string {
    return id.replace('-', '');
  }

  /**
   * Create QrCodeDynamic.
   *
   * @param qrCodeDynamic Qr Code Dynamic data.
   * @returns QrCodeDynamic created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {ForbiddenException} Thrown when userId is not the qrCodeDynamic owner.
   * @throws {UserNotFoundException} Thrown when user is not found.
   */
  async execute(qrCodeDynamic: Partial<QrCodeDynamic>): Promise<QrCodeDynamic> {
    // Data input check
    if (
      !qrCodeDynamic ||
      !qrCodeDynamic?.id ||
      !qrCodeDynamic?.user?.uuid ||
      !qrCodeDynamic?.pixKey?.key
    ) {
      throw new MissingDataException([
        ...(!qrCodeDynamic ? ['Qr Code Dynamic'] : []),
        ...(!qrCodeDynamic?.id ? ['ID'] : []),
        ...(!qrCodeDynamic?.user?.uuid ? ['User UUID'] : []),
        ...(!qrCodeDynamic?.pixKey?.key ? ['PixKey Key'] : []),
      ]);
    }

    // Check if QrCodeDynamic's ID is available
    const checkQrCodeDynamic = await this.repository.getById(qrCodeDynamic.id);

    this.logger.debug('Check if QrCodeDynamic exists.', {
      qrCodeDynamic: checkQrCodeDynamic,
    });

    if (checkQrCodeDynamic) {
      if (checkQrCodeDynamic.user.uuid === qrCodeDynamic.user.uuid) {
        return checkQrCodeDynamic;
      } else {
        throw new ForbiddenException();
      }
    }

    // Search pixKey
    const pixKeyFound = await this.pixKeyService.getPixKeyByKeyAndUser(
      qrCodeDynamic.pixKey,
      qrCodeDynamic.user,
    );

    this.logger.debug('Found pixKey.', { pixKey: pixKeyFound });

    if (!pixKeyFound) {
      throw new PixKeyNotFoundException(qrCodeDynamic.pixKey);
    }

    if (!pixKeyFound.isReadyState()) {
      throw new PixKeyInvalidStateException(pixKeyFound);
    }

    // Search and validate user
    const userFound = await this.userService.getUserByUuid(qrCodeDynamic.user);

    this.logger.debug('Found user.', { user: userFound });

    if (!userFound) {
      throw new UserNotFoundException(qrCodeDynamic.user);
    }

    if (!userFound.document || !userFound.fullName || !userFound.type) {
      throw new MissingDataException([
        ...(!userFound.document ? ['Document'] : []),
        ...(!userFound.fullName ? ['FullName'] : []),
        ...(!userFound.type ? ['Type'] : []),
      ]);
    }

    Object.assign(qrCodeDynamic.user, userFound);

    // Search user's onboarding
    const onboardingFound =
      await this.userService.getOnboardingByUserAndStatusIsFinished(
        qrCodeDynamic.user,
      );

    this.logger.debug('Found onboarding.', { onboarding: onboardingFound });

    if (!onboardingFound) {
      throw new OnboardingNotFoundException({ user: qrCodeDynamic.user });
    }
    if (!onboardingFound.address) {
      throw new AddressNotFoundException();
    }

    // Search user's address
    const addressFound = await this.userService.getAddressById({
      id: onboardingFound.address.id,
      user: qrCodeDynamic.user,
    });

    this.logger.debug('Found address.', { address: addressFound });

    if (!addressFound?.city) {
      throw new AddressNotFoundException(onboardingFound.address);
    }

    const newQrCodeDynamic = new QrCodeDynamicEntity({
      id: qrCodeDynamic.id,
      user: qrCodeDynamic.user,
      documentValue: qrCodeDynamic.documentValue,
      summary: qrCodeDynamic.summary,
      description: qrCodeDynamic.description,
      txId: this.createTxId(qrCodeDynamic.id),
      state: PixQrCodeDynamicState.PENDING,
      dueDate:
        qrCodeDynamic.dueDate &&
        getMoment(qrCodeDynamic.dueDate, 'YYYY-MM-DD').toDate(),
      pixKey: pixKeyFound,
      expirationDate: qrCodeDynamic.expirationDate,
      recipientName: userFound.fullName,
      recipientAddress: addressFound.street,
      recipientZipCode: addressFound.zipCode,
      recipientFeredativeUnit: addressFound.federativeUnit,
      recipientDocument: userFound.document,
      recipientPersonType: userFound.type,
      recipientCity: addressFound.city,
      payerName: qrCodeDynamic.payerName,
      payerPersonType: qrCodeDynamic.payerPersonType,
      payerDocument: qrCodeDynamic.payerDocument,
      payerEmail: qrCodeDynamic.payerEmail,
      payerCity: qrCodeDynamic.payerCity,
      payerPhone: qrCodeDynamic.payerPhone,
      payerAddress: qrCodeDynamic.payerAddress,
      payerRequest: qrCodeDynamic.payerRequest,
      allowUpdate: qrCodeDynamic.allowUpdate,
      allowUpdateChange: qrCodeDynamic.allowUpdateChange,
      allowUpdateWithdrawal: qrCodeDynamic.allowUpdateWithdrawal,
    });

    // Save QrCodeDynamic
    await this.repository.create(newQrCodeDynamic);

    // Fire PendingQrCodeDynamicEvent
    this.eventEmitter.pendingQrCodeDynamic(newQrCodeDynamic);

    this.logger.debug('Added QrCodeDynamic.', { newQrCodeDynamic });

    return newQrCodeDynamic;
  }
}
