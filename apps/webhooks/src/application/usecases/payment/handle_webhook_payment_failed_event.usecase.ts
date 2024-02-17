import { Logger } from 'winston';
import { MissingDataException, getMoment } from '@zro/common';
import {
  WebhookEvent,
  WebhookEventEntity,
  WebhookEventRepository,
  WebhookEventState,
  WebhookRepository,
  WebhookType,
} from '@zro/webhooks/domain';
import { Payment, PaymentState } from '@zro/pix-payments/domain';
import {
  WebhookEventEmitter,
  PixPaymentService,
  WebhookTargetGatewayPaymentFailedRequest,
} from '@zro/webhooks/application';
import {
  PaymentNotFoundException,
  PaymentInvalidStateException,
} from '@zro/pix-payments/application';

export class HandleWebhookPaymentFailedEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param webhookRepository Webhook repository.
   * @param webhookEventRepository Webhook Event repository.
   * @param pixPaymentService PixPayment service.
   * @param eventEmitter WebhookEvent event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly webhookRepository: WebhookRepository,
    private readonly webhookEventRepository: WebhookEventRepository,
    private readonly pixPaymentService: PixPaymentService,
    private readonly eventEmitter: WebhookEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleWebhookPaymentFailedEventUseCase.name,
    });
  }

  /**
   * Handler triggered when payment is failed.
   *
   * @param {Payment} payment Payment failed.
   * @returns {WebhookEvent} WebhookEvent created.
   */
  async execute(payment: Payment): Promise<WebhookEvent> {
    // Data input check
    if (!payment?.id) {
      throw new MissingDataException(['Payment']);
    }

    // Get pix payment by id.
    const paymentFound = await this.pixPaymentService.getById(payment.id);

    if (!paymentFound) {
      throw new PaymentNotFoundException(payment);
    }

    this.logger.debug('Pix payment found.', { paymentFound });

    // Indepotent
    if (paymentFound.state !== PaymentState.FAILED) {
      throw new PaymentInvalidStateException(paymentFound);
    }

    // Exists payment failed webhook for this agency and account?.
    const webhookFound =
      await this.webhookRepository.getActivateAndPaymentFailedByAccountAndAgency(
        paymentFound.ownerAccountNumber,
        paymentFound.ownerBranch,
      );

    this.logger.debug('Webhook found.', { webhookFound });

    if (!webhookFound) {
      return;
    }
    // Mount webhook target gateway payload
    const webhookTargetPayload: WebhookTargetGatewayPaymentFailedRequest = {
      id: paymentFound.id,
      endToEndId: paymentFound.endToEndId,
      txId: paymentFound.txId,
      value: paymentFound.value,
      operationId: paymentFound.operation?.id,
      ownerFullName: paymentFound.ownerFullName,
      ownerPersonType: paymentFound.ownerPersonType,
      ownerDocument: paymentFound.ownerDocument,
      ownerAccountNumber: paymentFound.ownerAccountNumber,
      ownerBranch: paymentFound.ownerBranch,
      beneficiaryName: paymentFound.beneficiaryName,
      beneficiaryPersonType: paymentFound.beneficiaryPersonType,
      beneficiaryDocument: paymentFound.beneficiaryDocument,
      beneficiaryBankName: paymentFound.beneficiaryBankName,
      beneficiaryBankIspb: paymentFound.beneficiaryBankIspb,
      errorCode: paymentFound?.failed?.code,
      errorDescription: paymentFound?.failed?.message,
      createdAt: paymentFound.createdAt,
    };

    const webhookEvent = new WebhookEventEntity({
      state: WebhookEventState.PENDING,
      targetUrl: webhookFound.targetUrl,
      apiKey: webhookFound.apiKey,
      webhook: webhookFound,
      type: WebhookType.PAYMENT_FAILED,
      accountNumber: webhookFound.accountNumber,
      agencyNumber: webhookFound.agencyNumber,
      data: webhookTargetPayload,
      retryLimit: getMoment().add(7, 'days').toDate(),
    });

    const webhookEventCreated =
      await this.webhookEventRepository.create(webhookEvent);

    this.logger.debug('Webhook Event created', { webhookEventCreated });

    this.eventEmitter.created(webhookEventCreated);

    return webhookEventCreated;
  }
}
