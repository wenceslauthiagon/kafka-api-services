import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  MissingDataException,
  ForbiddenException,
  getMoment,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  CurrencyEntity,
  OperationEntity,
  Wallet,
} from '@zro/operations/domain';
import {
  DecodedPixAccountRepository,
  DecodedPixAccountState,
  Payment,
  PaymentEntity,
  PaymentPriorityType,
  PaymentRepository,
  PaymentState,
  PaymentType,
} from '@zro/pix-payments/domain';
import {
  PaymentEventEmitter,
  PaymentInvalidDateException,
  UserService,
  OperationService,
  DecodedPixAccountEventEmitter,
  DecodedPixAccountInvalidStateException,
  DecodedPixAccountNotFoundException,
} from '@zro/pix-payments/application';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import {
  WalletAccountNotActiveException,
  WalletAccountNotFoundException,
} from '@zro/operations/application';

export class CreateByAccountPaymentUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param paymentRepository Payment repository.
   * @param decodedPixAccountRepository DecodedPixAccount repository.
   * @param paymentEmitter Payment event emitter.
   * @param decodedPixAccountEmitter DecodedPixKey event emitter.
   * @param userService User Service
   * @param operationService User Service
   */
  constructor(
    private logger: Logger,
    private readonly paymentRepository: PaymentRepository,
    private readonly decodedPixAccountRepository: DecodedPixAccountRepository,
    private readonly paymentEmitter: PaymentEventEmitter,
    private readonly decodedPixAccountEmitter: DecodedPixAccountEventEmitter,
    private readonly userService: UserService,
    private readonly operationService: OperationService,
    private readonly pixPaymentOperationCurrencyTag: string,
    private readonly pixPaymentOperationSendAccountTransactionTag: string,
  ) {
    this.logger = logger.child({ context: CreateByAccountPaymentUseCase.name });
  }

  /**
   * Create Payment.
   *
   * @param payment Payment data.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {InvalidPaymentException} Thrown when payment data is not for today neither scheduled.
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
      !payment?.value ||
      !payment?.decodedPixAccount?.id
    ) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!payment?.id ? ['Payment ID'] : []),
        ...(!payment?.value ? ['Payment Value'] : []),
        ...(!payment?.decodedPixAccount?.id ? ['Payment Pix Account ID'] : []),
      ]);
    }

    this.logger.debug('Receive Payment data.', { payment });

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

    // Search decodedPixKey
    const decodedPixAccount = await this.decodedPixAccountRepository.getById(
      payment.decodedPixAccount.id,
    );

    this.logger.debug('Decoded pix account found.', { decodedPixAccount });

    if (!decodedPixAccount) {
      throw new DecodedPixAccountNotFoundException({
        id: payment.decodedPixAccount.id,
      });
    }

    // Check Sanity, only DecodedPixAccount Pending is accept
    if (decodedPixAccount.state !== DecodedPixAccountState.PENDING) {
      throw new DecodedPixAccountInvalidStateException({
        id: payment.decodedPixAccount.id,
      });
    }

    // Mount payment object and fire event
    const newPayment = new PaymentEntity({
      ...payment,
      beneficiaryBranch: decodedPixAccount.branch,
      beneficiaryBankName: decodedPixAccount.bank.name,
      beneficiaryBankIspb: decodedPixAccount.bank.ispb,
      beneficiaryName: decodedPixAccount.name,
      beneficiaryAccountNumber: decodedPixAccount.accountNumber,
      beneficiaryDocument: decodedPixAccount.document,
      beneficiaryAccountType: decodedPixAccount.accountType,
      beneficiaryPersonType: decodedPixAccount.personType,
      paymentType: PaymentType.ACCOUNT,
      transactionTag: this.pixPaymentOperationSendAccountTransactionTag,
      state,
      priorityType,
      paymentDate: payment.paymentDate
        ? getMoment(payment.paymentDate).toDate()
        : null,
      operation: new OperationEntity({ id: uuidV4() }),
      user,
      wallet,
      ownerAccountNumber: ownerWalletAccount.accountNumber,
      ownerBranch: ownerWalletAccount.branchNumber,
      ownerDocument: user.document,
      ownerFullName: user.fullName,
      ownerPersonType: user.type,
    });

    // Fire event according to state payment
    state === PaymentState.PENDING
      ? this.paymentEmitter.pendingPayment(newPayment)
      : this.paymentEmitter.scheduledPayment(newPayment);

    // Save Payment on database
    await this.paymentRepository.create(newPayment);

    this.logger.debug('Payment by account added.', { newPayment });

    // Confirm decoded pix account state after create payment and fire event
    decodedPixAccount.state = DecodedPixAccountState.CONFIRMED;
    await this.decodedPixAccountRepository.update(decodedPixAccount);

    this.decodedPixAccountEmitter.confirmedDecodedPixAccount(decodedPixAccount);

    return newPayment;
  }
}
