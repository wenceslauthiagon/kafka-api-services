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
import {
  PixDevolutionReceivedState,
  PixDevolutionReceived,
} from '@zro/pix-payments/domain';
import {
  PixDevolutionReceivedNotFoundException,
  PixDevolutionReceivedInvalidStateException,
} from '@zro/pix-payments/application';
import {
  WebhookEventEmitter,
  PixPaymentService,
  WebhookTargetGatewayPixDevolutionReceivedRequest,
} from '@zro/webhooks/application';

export class HandleWebhookDevolutionReceivedEventUseCase {
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
      context: HandleWebhookDevolutionReceivedEventUseCase.name,
    });
  }

  /**
   * Handler triggered when devolution received is received.
   *
   * @param devolutionReceived devolution received.
   * @returns WebhookEvent created.
   */
  async execute(
    devolutionReceived: PixDevolutionReceived,
  ): Promise<WebhookEvent> {
    // Data input check
    if (!devolutionReceived?.id) {
      throw new MissingDataException(['Devolution Received']);
    }

    // Get pix devolution received by id.
    const devolutionReceivedFound =
      await this.pixPaymentService.getDevolutionReceivedById(
        devolutionReceived.id,
      );

    this.logger.debug('Pix devolution received found.', {
      devolutionReceivedFound,
    });

    if (!devolutionReceivedFound) {
      throw new PixDevolutionReceivedNotFoundException(devolutionReceived.id);
    }

    // Sanity check
    if (devolutionReceivedFound.state !== PixDevolutionReceivedState.READY) {
      throw new PixDevolutionReceivedInvalidStateException(devolutionReceived);
    }

    // Exists devolution received webhook for this agency and account.
    const webhookFound =
      await this.webhookRepository.getActivateAndDevolutionReceivedByAccountAndAgency(
        devolutionReceivedFound.clientAccountNumber,
        devolutionReceivedFound.clientBranch,
      );

    this.logger.debug('Webhook found.', { webhookFound });

    if (!webhookFound) {
      return;
    }

    // Mount webhook target gateway payload
    const webhookTargetPayload: WebhookTargetGatewayPixDevolutionReceivedRequest =
      {
        id: devolutionReceivedFound.id,
        endToEndId: devolutionReceivedFound.endToEndId,
        txId: devolutionReceivedFound.txId,
        amount: devolutionReceivedFound.amount,
        operationId: devolutionReceivedFound.operation?.id,
        thirdPartName: devolutionReceivedFound.thirdPartName,
        thirdPartPersonType: devolutionReceivedFound.thirdPartPersonType,
        thirdPartDocument: devolutionReceivedFound.thirdPartDocument,
        thirdPartAccountNumber: devolutionReceivedFound.thirdPartAccountNumber,
        thirdPartBranch: devolutionReceivedFound.thirdPartBranch,
        thirdPartBankName: devolutionReceivedFound.thirdPartBank?.name,
        thirdPartBankIspb: devolutionReceivedFound.thirdPartBank?.ispb,
        clientName: devolutionReceivedFound.clientName,
        clientPersonType: devolutionReceivedFound.clientPersonType,
        clientDocument: devolutionReceivedFound.clientDocument,
        clientBankName: devolutionReceivedFound.clientBank?.name,
        clientBankIspb: devolutionReceivedFound.clientBank?.ispb,
        createdAt: devolutionReceivedFound.createdAt,
      };

    const webhookEvent = new WebhookEventEntity({
      state: WebhookEventState.PENDING,
      targetUrl: webhookFound.targetUrl,
      apiKey: webhookFound.apiKey,
      webhook: webhookFound,
      type: WebhookType.DEVOLUTION_RECEIVED,
      accountNumber: webhookFound.accountNumber,
      agencyNumber: webhookFound.agencyNumber,
      data: webhookTargetPayload,
      retryLimit: getMoment().add(7, 'days').toDate(),
    });

    const webhookCreated =
      await this.webhookEventRepository.create(webhookEvent);

    this.eventEmitter.created(webhookCreated);

    return webhookCreated;
  }
}
