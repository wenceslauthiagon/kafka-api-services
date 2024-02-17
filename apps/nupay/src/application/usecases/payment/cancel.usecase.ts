import { Logger } from 'winston';
import { CheckoutRepository, PaymentStatusEnum } from '@zro/nupay/domain';
import { CancelPaymentResponse } from '@zro/nupay/interface';
import {
  CheckoutInvalidStateException,
  CheckoutNotFoundException,
  IPaymentService,
} from '@zro/nupay/application';

export class CancelPaymentUseCase {
  constructor(
    private logger: Logger,
    private readonly nupayService: IPaymentService,
    private readonly checkoutRepository: CheckoutRepository,
  ) {
    this.logger = logger.child({ context: CancelPaymentUseCase.name });
  }

  async execute(checkoutId: string): Promise<CancelPaymentResponse> {
    this.logger.debug('Check if checkout exists.', { checkoutId });

    const checkout = await this.checkoutRepository.getById(checkoutId);

    if (!checkout) {
      throw new CheckoutNotFoundException({ id: checkoutId });
    }

    if (checkout.status == PaymentStatusEnum.CANCELLED) {
      return checkout;
    }

    if (
      checkout.status == PaymentStatusEnum.COMPLETED ||
      checkout.status == PaymentStatusEnum.PRE_CHECKOUT
    ) {
      throw new CheckoutInvalidStateException(checkout);
    }

    this.logger.debug('Found checkout.', { checkout });

    const pspReferenceId = checkout.referenceId;

    this.logger.debug('Canceling payment.', { pspReferenceId });

    const response = await this.nupayService.cancel(pspReferenceId);

    this.logger.debug('Payment cancelled.', { response });

    return new CancelPaymentResponse({
      id: checkout.id,
      status: checkout.status,
      referenceId: checkout.referenceId,
      authorizationId: checkout.authorizationId,
      destination: checkout.destination,
      requesterName: checkout.requesterName,
      requesterDocument: checkout.requesterDocument,
      requesterContact: checkout.requesterContact,
      currency: checkout.currency,
      amount: checkout.amount,
      createdAt: checkout.createdAt,
      updatedAt: checkout.updatedAt,
      expiresAt: checkout.expiresAt,
    });
  }
}
