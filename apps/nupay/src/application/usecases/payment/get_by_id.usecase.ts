import { Logger } from 'winston';
import { CheckoutRepository } from '@zro/nupay/domain';
import { GetByIdPaymentResponse } from '@zro/nupay/interface';

export class GetByIdPaymentUseCase {
  constructor(
    private logger: Logger,
    private readonly checkoutRepository: CheckoutRepository,
  ) {}

  async execute(checkoutId: string): Promise<GetByIdPaymentResponse> {
    this.logger.debug('Get payment by id', { checkoutId });
    const checkout = await this.checkoutRepository.getById(checkoutId);
    this.logger.debug('Payment found', { checkoutId });

    return new GetByIdPaymentResponse({
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
