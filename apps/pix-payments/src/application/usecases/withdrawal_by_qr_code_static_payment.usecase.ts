import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  MissingDataException,
  ForbiddenException,
  getMoment,
} from '@zro/common';
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
  PixAgentMod,
} from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';
import {
  CurrencyEntity,
  OperationEntity,
  Wallet,
} from '@zro/operations/domain';
import {
  PaymentEventEmitter,
  UserService,
  OperationService,
  BankingService,
  BankNotFoundException,
  DecodedQrCodeNotFoundException,
  DecodedQrCodeInvalidStateException,
  PaymentValueIsNotPositiveException,
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

export class WithdrawalByQrCodeStaticPaymentUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param paymentRepository Payment repository.
   * @param decodedQrCodeRepository DecodedQrCode repository.
   * @param eventEmitter Payment event emitter.
   * @param userService User service gateway.
   * @param operationService Operation service gateway.
   * @param bankingService Banking service gateway.
   */
  constructor(
    private logger: Logger,
    private readonly paymentRepository: PaymentRepository,
    private readonly decodedQrCodeRepository: DecodedQrCodeRepository,
    private readonly eventEmitter: PaymentEventEmitter,
    private readonly userService: UserService,
    private readonly operationService: OperationService,
    private readonly bankingService: BankingService,
    private readonly pixPaymentOperationCurrencyTag: string,
    private readonly pixPaymentOperationWithdrawalQrsTransactionTag: string,
    private readonly pixPaymentAgentModWithdrawal: string,
  ) {
    this.logger = logger.child({
      context: WithdrawalByQrCodeStaticPaymentUseCase.name,
    });
  }

  /**
   * Withdrawal qr code static Payment.
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

    this.logger.debug('Receive Withdrawal QRCode Static Payment data.', {
      payment,
    });

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

    const decodedQrCode = await this.decodedQrCodeRepository.getById(
      payment.decodedQrCode.id,
    );

    if (!decodedQrCode) {
      throw new DecodedQrCodeNotFoundException({
        id: payment.decodedQrCode.id,
      });
    }

    this.logger.debug('Decoded QRCode static found.', { decodedQrCode });

    // Check Sanity, Only QRCode Ready is accept
    if (decodedQrCode.state !== DecodedQrCodeState.READY) {
      throw new DecodedQrCodeInvalidStateException({
        id: payment.decodedQrCode.id,
      });
    }

    // Check Sanity, Only QRCode QR_CODE_STATIC_WITHDRAWAL is accept.
    if (decodedQrCode.type !== DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL) {
      throw new DecodedQrCodeInvalidTypeException(decodedQrCode.type);
    }

    // Use the value of the qr code to create the payment, if it does not exist use the payment.value if it is greater than 0
    if (decodedQrCode.paymentValue > 0)
      payment.value = decodedQrCode.paymentValue;

    if (payment.value <= 0) {
      throw new PaymentValueIsNotPositiveException({
        value: payment.value,
      });
    }

    // If not exists PSS is payment instant billing
    if (decodedQrCode.pss) {
      const foundBank = await this.bankingService.getBankByIspb(
        decodedQrCode.pss,
      );

      this.logger.debug('Found ispb by code.', { foundBank });

      if (!foundBank) {
        throw new BankNotFoundException(foundBank);
      }
    } else {
      throw new MissingDataException(['PSS Agent ISPB']);
    }

    // Set pending status and fire event pending
    const newPayment = new PaymentEntity({
      ...payment,
      paymentType: PaymentType.QR_CODE_STATIC_WITHDRAWAL,
      transactionTag: this.pixPaymentOperationWithdrawalQrsTransactionTag,
      state: PaymentState.PENDING,
      priorityType: PaymentPriorityType.PRIORITY,
      paymentDate: getMoment().toDate(),
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
      agentMod: PixAgentMod[this.pixPaymentAgentModWithdrawal],
      agentIspb: decodedQrCode.pss,
    });

    // Fire pendingPayment
    this.eventEmitter.pendingPayment(newPayment);

    // Save Payment on database
    await this.paymentRepository.create(newPayment);

    this.logger.debug('Payment by QRCode static withdrawal added.', {
      newPayment,
    });

    return newPayment;
  }
}
