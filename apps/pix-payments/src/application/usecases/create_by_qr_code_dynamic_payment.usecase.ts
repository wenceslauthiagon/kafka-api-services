import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  MissingDataException,
  ForbiddenException,
  getMoment,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  DecodedQrCodeRepository,
  DecodedQrCodeState,
  DecodedQrCodeType,
  Payment,
  PaymentEntity,
  PaymentPriorityType,
  PaymentRepository,
  PaymentState,
  PaymentType,
} from '@zro/pix-payments/domain';
import {
  CurrencyEntity,
  OperationEntity,
  Wallet,
} from '@zro/operations/domain';
import {
  PaymentEventEmitter,
  UserService,
  OperationService,
  DecodedQrCodeNotFoundException,
  DecodedQrCodeInvalidStateException,
  PaymentInvalidDateException,
  PaymentValueIsNotPositiveException,
  DecodedQrCodeExpiredException,
  DecodedQrCodeInvalidTypeException,
} from '@zro/pix-payments/application';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import {
  WalletAccountNotActiveException,
  WalletAccountNotFoundException,
} from '@zro/operations/application';

export class CreateByQrCodeDynamicPaymentUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param paymentRepository Payment repository.
   * @param decodedQrCodeRepository DecodedQrCode repository.
   * @param eventEmitter Payment event emitter.
   * @param userService User service gateway.
   * @param operationService Operation service gateway.
   */
  constructor(
    private logger: Logger,
    private readonly paymentRepository: PaymentRepository,
    private readonly decodedQrCodeRepository: DecodedQrCodeRepository,
    private readonly eventEmitter: PaymentEventEmitter,
    private readonly userService: UserService,
    private readonly operationService: OperationService,
    private readonly pixPaymentOperationCurrencyTag: string,
    private readonly pixPaymentOperationSendQrdTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: CreateByQrCodeDynamicPaymentUseCase.name,
    });
  }

  /**
   * Create qr code dynamic Payment.
   *
   * @param payment Payment data.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {UserNotFoundException} Thrown when user is not found.
   * @throws {OnboardingNotFoundException} Thrown when user onboarding is not found.
   * @throws {DecodedQrCodeNotFoundException} Thrown when payment decoded qr code is not found.
   * @throws {DecodedQrCodeInvalidStateException} Thrown when payment decoded qr code state is not accept.
   * @throws {InvalidPaymentException} Thrown when payment data is valid.
   *
   */
  async execute(
    user: User,
    wallet: Wallet,
    payment: Payment,
  ): Promise<Payment> {
    // Data input check
    if (
      !user?.uuid ||
      !wallet?.uuid ||
      !payment?.id ||
      !payment?.decodedQrCode?.id
    ) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!payment?.id ? ['Payment ID'] : []),
        ...(!payment?.decodedQrCode?.id ? ['Payment Qr Code ID'] : []),
      ]);
    }

    this.logger.debug('Receive QRCode dynamic payment data.', { payment });

    // Check if Payment's ID is available
    const checkPayment = await this.paymentRepository.getById(payment.id);

    this.logger.debug('Check if payment already exists.', {
      payment: checkPayment,
    });

    if (checkPayment) {
      if (checkPayment.wallet.uuid !== wallet.uuid) {
        throw new ForbiddenException();
      }
      return checkPayment;
    }

    // TODO: NOTIFICATION IT TEAM
    // Search user
    const userFound = await this.userService.getUserByUuid(user);

    this.logger.debug('Found user.', { user: userFound });

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

    // Get ownerUser wallet account to get Client account number and Client branch
    const currency = new CurrencyEntity({
      tag: this.pixPaymentOperationCurrencyTag,
    });
    const ownerWalletAccount =
      await this.operationService.getWalletAccountByWalletAndCurrency(
        wallet,
        currency,
      );

    this.logger.debug('Wallet account by currency base found.', {
      ownerWalletAccount,
    });

    if (!ownerWalletAccount) {
      throw new WalletAccountNotFoundException({ currency, wallet });
    }
    if (!ownerWalletAccount.isActive()) {
      throw new WalletAccountNotActiveException(ownerWalletAccount);
    }
    if (
      !ownerWalletAccount?.accountNumber ||
      !ownerWalletAccount?.branchNumber
    ) {
      throw new MissingDataException([
        ...(!ownerWalletAccount?.accountNumber ? ['Account Number'] : []),
        ...(!ownerWalletAccount?.branchNumber ? ['Branch Number'] : []),
      ]);
    }

    // Check if payment is right now or scheduled
    let state: PaymentState;
    let priorityType: PaymentPriorityType;
    if (payment.isTodayPayment()) {
      state = PaymentState.PENDING;
      priorityType = PaymentPriorityType.PRIORITY;
    } else if (payment.isScheduledPayment()) {
      state = PaymentState.SCHEDULED;
      priorityType = PaymentPriorityType.NOT_PRIORITY;
    } else {
      throw new PaymentInvalidDateException({
        paymentDate: payment.paymentDate,
      });
    }

    const decodedQrCode = await this.decodedQrCodeRepository.getById(
      payment.decodedQrCode.id,
    );

    if (!decodedQrCode) {
      throw new DecodedQrCodeNotFoundException({
        id: payment.decodedQrCode.id,
      });
    }

    this.logger.debug('Decoded QRCode dynamic found.', { decodedQrCode });

    //Check Sanity, Only QRCode Ready is accept
    if (decodedQrCode.state !== DecodedQrCodeState.READY) {
      throw new DecodedQrCodeInvalidStateException({
        id: payment.decodedQrCode.id,
      });
    }

    // Check Sanity, Only QRCode QR_CODE_DYNAMIC_INSTANT_PAYMENT is accept.
    if (
      decodedQrCode.type !== DecodedQrCodeType.QR_CODE_DYNAMIC_INSTANT_PAYMENT
    ) {
      throw new DecodedQrCodeInvalidTypeException(decodedQrCode.type);
    }

    //Dont pay if QRCode was expired
    if (decodedQrCode.isExpiredQrCode()) {
      throw new DecodedQrCodeExpiredException(decodedQrCode);
    }

    //If the payment does not allow changing the value, use the value of the qr code.
    //If the payment allows changing the value, use the value sent by body if greater than 0.
    if (!decodedQrCode.allowUpdate) payment.value = decodedQrCode.documentValue;

    if (payment.value <= 0) {
      throw new PaymentValueIsNotPositiveException({ value: payment.value });
    }

    // Set pending status and fire event pending
    const newPayment = new PaymentEntity({
      ...payment,
      paymentType: PaymentType.QR_CODE_DYNAMIC_INSTANT,
      transactionTag: this.pixPaymentOperationSendQrdTransactionTag,
      state,
      priorityType,
      paymentDate: payment.paymentDate
        ? getMoment(payment.paymentDate).toDate()
        : getMoment().toDate(),
      operation: new OperationEntity({ id: uuidV4() }),
      user,
      wallet,
      ownerAccountNumber: ownerWalletAccount.accountNumber,
      ownerBranch: ownerWalletAccount.branchNumber,
      ownerDocument: user.document,
      ownerFullName: user.fullName,
      ownerPersonType: user.type,
      txId: decodedQrCode.txId,
      key: decodedQrCode.key,
      endToEndId: decodedQrCode.endToEndId,
      beneficiaryAccountType: decodedQrCode.recipientAccountType,
      beneficiaryPersonType: decodedQrCode.recipientPersonType,
      beneficiaryBranch: decodedQrCode.recipientBranch,
      beneficiaryAccountNumber: decodedQrCode.recipientAccountNumber,
      beneficiaryBankName: decodedQrCode.recipientBankName,
      beneficiaryBankIspb: decodedQrCode.recipientBankIspb,
      beneficiaryDocument: decodedQrCode.recipientDocument,
      beneficiaryName: decodedQrCode.recipientName,
    });

    // Fire event according to state payment
    state === PaymentState.PENDING
      ? this.eventEmitter.pendingPayment(newPayment)
      : this.eventEmitter.scheduledPayment(newPayment);

    // Save Payment on database
    await this.paymentRepository.create(newPayment);

    this.logger.debug('Payment by QRCode dynamic added.', { newPayment });

    return newPayment;
  }
}
