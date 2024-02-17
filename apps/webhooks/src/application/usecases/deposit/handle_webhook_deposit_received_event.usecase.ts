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
import { PixDeposit, PixDepositState } from '@zro/pix-payments/domain';
import {
  PixDepositNotFoundException,
  PixDepositInvalidStateException,
} from '@zro/pix-payments/application';
import {
  WebhookEventEmitter,
  PixPaymentService,
  WebhookTargetGatewayDepositRequest,
} from '@zro/webhooks/application';

export class HandleWebhookDepositReceivedEventUseCase {
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
      context: HandleWebhookDepositReceivedEventUseCase.name,
    });
  }

  /**
   * Handler triggered when deposit is received.
   *
   * @param deposit PixDeposit received.
   * @returns WebhookEvent created.
   */
  async execute(deposit: PixDeposit): Promise<WebhookEvent> {
    // Data input check
    if (!deposit?.id) {
      throw new MissingDataException(['Deposit']);
    }

    // Get pix payment by id.
    const depositFound = await this.pixPaymentService.getPixDepositById(
      deposit.id,
    );

    this.logger.debug('Pix Deposit found.', { depositFound });

    if (!depositFound) {
      throw new PixDepositNotFoundException(deposit);
    }

    // Sanity check
    if (depositFound.state !== PixDepositState.RECEIVED) {
      throw new PixDepositInvalidStateException(depositFound);
    }

    // Exists deposit received webhook for this agency and account?.
    const webhookFound =
      await this.webhookRepository.getActivateAndDepositReceivedByAccountAndAgency(
        depositFound.clientAccountNumber,
        depositFound.clientBranch,
      );

    this.logger.debug('Webhook found.', { webhookFound });

    if (!webhookFound) {
      return;
    }

    // Mount webhook target gateway payload
    const webhookTargetPayload: WebhookTargetGatewayDepositRequest = {
      id: depositFound.id,
      endToEndId: depositFound.endToEndId,
      txId: depositFound.txId,
      amount: depositFound.amount,
      operationId: depositFound.operation?.id,
      thirdPartName: depositFound.thirdPartName,
      thirdPartPersonType: depositFound.thirdPartPersonType,
      thirdPartDocument: depositFound.thirdPartDocument,
      thirdPartAccountNumber: depositFound.thirdPartAccountNumber,
      thirdPartBranch: depositFound.thirdPartBranch,
      thirdPartBankName: depositFound.thirdPartBank?.name,
      thirdPartBankIspb: depositFound.thirdPartBank?.ispb,
      clientName: depositFound.clientName,
      clientAccountNumber: depositFound.clientAccountNumber,
      clientPersonType: depositFound.clientPersonType,
      clientDocument: depositFound.clientDocument,
      clientBankName: depositFound.clientBank?.name,
      clientBankIspb: depositFound.clientBank?.ispb,
      createdAt: depositFound.createdAt,
    };

    const webhookEvent = new WebhookEventEntity({
      state: WebhookEventState.PENDING,
      targetUrl: webhookFound.targetUrl,
      apiKey: webhookFound.apiKey,
      webhook: webhookFound,
      type: WebhookType.DEPOSIT_RECEIVED,
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
