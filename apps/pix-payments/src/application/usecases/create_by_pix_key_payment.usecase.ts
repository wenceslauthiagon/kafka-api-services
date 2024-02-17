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
import { DecodedPixKeyState } from '@zro/pix-keys/domain';
import {
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
  BankNotFoundException,
  PixKeyService,
  UserService,
  OperationService,
  BankingService,
} from '@zro/pix-payments/application';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import {
  DecodedPixKeyNotFoundException,
  DecodedPixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import {
  WalletAccountNotActiveException,
  WalletAccountNotFoundException,
} from '@zro/operations/application';

export class CreateByPixKeyPaymentUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param paymentRepository Payment repository.
   * @param paymentEmitter Payment event emitter.
   * @param pixKeyService Pix Key service gateway.
   * @param userService User service gateway.
   * @param operationService Operation service gateway.
   */
  constructor(
    private logger: Logger,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentEmitter: PaymentEventEmitter,
    private readonly pixKeyService: PixKeyService,
    private readonly userService: UserService,
    private readonly operationService: OperationService,
    private readonly bankingService: BankingService,
    private readonly pixPaymentOperationCurrencyTag: string,
    private readonly pixPaymentOperationSendKeyTransactionTag: string,
  ) {
    this.logger = logger.child({ context: CreateByPixKeyPaymentUseCase.name });
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
      !payment?.decodedPixKey?.id
    ) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!payment?.id ? ['Payment ID'] : []),
        ...(!payment?.value ? ['Payment Value'] : []),
        ...(!payment?.decodedPixKey?.id ? ['Payment Pix Key ID'] : []),
      ]);
    }

    this.logger.debug('Receive Payment data.', { payment });

    // Check if Payment's ID is available
    const checkPayment = await this.paymentRepository.getById(payment.id);

    this.logger.debug('Check if payment already exists.', {
      payment: checkPayment,
    });

    if (checkPayment) {
      if (checkPayment.wallet.uuid === wallet.uuid) {
        return checkPayment;
      } else {
        throw new ForbiddenException();
      }
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
    const decodedPixKey = await this.pixKeyService.getDecodedPixKeyById(
      payment.decodedPixKey.id,
    );

    this.logger.debug('Decoded pix key found.', { decodedPixKey });

    if (!decodedPixKey) {
      throw new DecodedPixKeyNotFoundException({
        id: payment.decodedPixKey.id,
      });
    }

    // Check Sanity, Only DecodedPixKey Pending is accept
    if (decodedPixKey.state !== DecodedPixKeyState.PENDING) {
      throw new DecodedPixKeyInvalidStateException({
        id: payment.decodedPixKey.id,
      });
    }

    const foundBank = await this.bankingService.getBankByIspb(
      decodedPixKey.ispb,
    );

    this.logger.debug('Found ispb by code.', { foundBank });

    if (!foundBank) {
      throw new BankNotFoundException(foundBank);
    }

    // Mount payment object and fire event
    const newPayment = new PaymentEntity({
      ...payment,
      beneficiaryBranch: decodedPixKey.branch,
      beneficiaryBankName: foundBank.name,
      beneficiaryBankIspb: decodedPixKey.ispb,
      beneficiaryName: decodedPixKey.name,
      beneficiaryAccountNumber: decodedPixKey.accountNumber,
      beneficiaryDocument: decodedPixKey.document,
      beneficiaryAccountType: decodedPixKey.accountType,
      beneficiaryPersonType: decodedPixKey.personType,
      endToEndId: decodedPixKey.endToEndId,
      key: decodedPixKey.key,
      paymentType: PaymentType.KEY,
      transactionTag: this.pixPaymentOperationSendKeyTransactionTag,
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

    this.logger.debug('Payment by key added.', { newPayment });

    // Confirm decoded pix key state after create payment and fire event
    await this.pixKeyService.updateDecodedPixKeyStateById(
      payment.decodedPixKey.id,
      DecodedPixKeyState.CONFIRMED,
    );

    return newPayment;
  }
}
