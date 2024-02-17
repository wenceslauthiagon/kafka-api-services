import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Operation, Wallet } from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import {
  DecodedPixAccountRepository,
  DecodedQrCodeRepository,
  Payment,
  PaymentRepository,
  PaymentType,
} from '@zro/pix-payments/domain';
import {
  DecodedQrCodeNotFoundException,
  DecodedPixAccountNotFoundException,
} from '@zro/pix-payments/application';

export class GetPaymentByOperationIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param paymentRepository Payment repository.
   */
  constructor(
    private logger: Logger,
    private readonly paymentRepository: PaymentRepository,
    private readonly decodedQrCodeRepository: DecodedQrCodeRepository,
    private readonly decodedPixAccountRepository: DecodedPixAccountRepository,
  ) {
    this.logger = logger.child({
      context: GetPaymentByOperationIdUseCase.name,
    });
  }

  /**
   * Get payment with decoded by operation.
   *
   * @param operation Payment operation.
   * @param [user] Payment user.
   * @param [wallet] Payment wallet.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @returns Payment data.
   */
  async execute(
    operation: Operation,
    user?: User,
    wallet?: Wallet,
  ): Promise<Payment> {
    // Data input check
    if (!operation?.id) {
      throw new MissingDataException(['Operation']);
    }

    // Get Payment
    const payment = await this.paymentRepository.getByOperation(operation);

    this.logger.debug('Payment found.', { payment });

    if (
      !payment ||
      (user && user?.uuid !== payment.user.uuid) ||
      (wallet && wallet?.uuid !== payment.wallet.uuid)
    ) {
      return null;
    }

    const getCompanion = {
      [PaymentType.KEY]: (body: Payment): Payment => body,
      [PaymentType.ACCOUNT]: this.getAccountPayment.bind(this),
      [PaymentType.QR_CODE]: this.getQrCodePayment.bind(this),
      [PaymentType.QR_CODE_STATIC_INSTANT]: this.getQrCodePayment.bind(this),
      [PaymentType.QR_CODE_STATIC_WITHDRAWAL]: this.getQrCodePayment.bind(this),
      [PaymentType.QR_CODE_DYNAMIC_DUE_DATE]: this.getQrCodePayment.bind(this),
      [PaymentType.QR_CODE_DYNAMIC_WITHDRAWAL]:
        this.getQrCodePayment.bind(this),
      [PaymentType.QR_CODE_DYNAMIC_CHANGE]: this.getQrCodePayment.bind(this),
      [PaymentType.QR_CODE_DYNAMIC_INSTANT]: this.getQrCodePayment.bind(this),
    };

    const result = await getCompanion[payment.paymentType](payment);

    this.logger.debug('Payment with decoded result.', { payment: result });

    return result;
  }

  private async getQrCodePayment(payment: Payment): Promise<Payment> {
    const decodedQrCode = await this.decodedQrCodeRepository.getById(
      payment.decodedQrCode.id,
    );

    this.logger.debug('DecodedQrCode found.', { decodedQrCode });

    if (!decodedQrCode) {
      throw new DecodedQrCodeNotFoundException({
        id: payment.decodedQrCode.id,
      });
    }

    payment.decodedQrCode = decodedQrCode;

    return payment;
  }

  private async getAccountPayment(payment: Payment): Promise<Payment> {
    const decodedPixAccount = await this.decodedPixAccountRepository.getById(
      payment.decodedPixAccount.id,
    );

    this.logger.debug('DecodedPixAccount found.', { decodedPixAccount });

    if (!decodedPixAccount) {
      throw new DecodedPixAccountNotFoundException({
        id: payment.decodedPixAccount.id,
      });
    }

    payment.decodedPixAccount = decodedPixAccount;

    return payment;
  }
}
