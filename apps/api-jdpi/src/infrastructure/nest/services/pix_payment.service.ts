import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { PixDeposit, PixDevolutionReceived } from '@zro/pix-payments/domain';
import {
  GetPaymentByEndToEndIdResponse,
  PixPaymentService,
  ReceivePixDepositResponse,
  ReceivePixDevolutionReceivedResponse,
} from '@zro/api-jdpi/application';
import {
  GetPaymentByEndToEndIdServiceKafka,
  ReceivePixDepositServiceKafka,
  ReceivePixDevolutionReceivedServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  GetPaymentByEndToEndIdRequest,
  ReceivePixDepositRequest,
  ReceivePixDevolutionReceivedRequest,
} from '@zro/pix-payments/interface';

/**
 * Pix payment microservice.
 */
export class PixPaymentServiceKafka implements PixPaymentService {
  static _services: any[] = [
    ReceivePixDepositServiceKafka,
    ReceivePixDevolutionReceivedServiceKafka,
    GetPaymentByEndToEndIdServiceKafka,
  ];

  private readonly receivePixDepositService: ReceivePixDepositServiceKafka;
  private readonly receivePixDevolutionReceivedService: ReceivePixDevolutionReceivedServiceKafka;
  private readonly getPaymentByEndToEndIdService: GetPaymentByEndToEndIdServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: PixPaymentServiceKafka.name });

    this.receivePixDepositService = new ReceivePixDepositServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
    this.receivePixDevolutionReceivedService =
      new ReceivePixDevolutionReceivedServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
    this.getPaymentByEndToEndIdService = new GetPaymentByEndToEndIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Create received pixDeposit.
   * @param request The pixDeposit.
   * @returns PixDevolution created.
   */
  async receivePixDeposit(
    request: PixDeposit,
  ): Promise<ReceivePixDepositResponse> {
    const data = new ReceivePixDepositRequest({
      id: request.id,
      amount: request.amount,
      txId: request.txId,
      endToEndId: request.endToEndId,
      clientBankIspb: request.clientBank.ispb,
      clientBranch: request.clientBranch,
      clientAccountNumber: request.clientAccountNumber,
      clientDocument: request.clientDocument,
      clientName: request.clientName,
      clientKey: request.clientKey,
      thirdPartBankIspb: request.thirdPartBank.ispb,
      thirdPartBranch: request.thirdPartBranch,
      thirdPartAccountType: request.thirdPartAccountType,
      thirdPartAccountNumber: request.thirdPartAccountNumber,
      thirdPartDocument: request.thirdPartDocument,
      thirdPartName: request.thirdPartName,
      thirdPartKey: request.thirdPartKey,
      description: request.description,
    });

    const response = await this.receivePixDepositService.execute(data);

    if (!response) return null;

    return {
      id: response.id,
      state: response.state,
      createdAt: response.createdAt,
    };
  }

  async receivePixDevolution(
    request: PixDevolutionReceived,
  ): Promise<ReceivePixDevolutionReceivedResponse> {
    const data = new ReceivePixDevolutionReceivedRequest({
      id: request.id,
      amount: request.amount,
      paymentEndToEndId: request.payment.endToEndId,
      txId: request.txId,
      endToEndId: request.endToEndId,
      clientBankIspb: request.clientBank.ispb,
      clientBranch: request.clientBranch,
      clientAccountNumber: request.clientAccountNumber,
      clientDocument: request.clientDocument,
      clientName: request.clientName,
      clientKey: request.clientKey,
      thirdPartBankIspb: request.thirdPartBank.ispb,
      thirdPartBranch: request.thirdPartBranch,
      thirdPartAccountType: request.thirdPartAccountType,
      thirdPartAccountNumber: request.thirdPartAccountNumber,
      thirdPartDocument: request.thirdPartDocument,
      thirdPartName: request.thirdPartName,
      thirdPartKey: request.thirdPartKey,
      description: request.description,
    });

    const response =
      await this.receivePixDevolutionReceivedService.execute(data);

    if (!response) return null;

    return {
      id: response.id,
      state: response.state,
      createdAt: response.createdAt,
    };
  }

  /**
   * Get Pix Payment by endToEndId.
   * @param endToEndId The Payment endToEndId.
   * @returns Payment.
   */
  async getPaymentByEndToEndId(
    endToEndId: string,
  ): Promise<GetPaymentByEndToEndIdResponse> {
    const data = new GetPaymentByEndToEndIdRequest({ endToEndId });

    const response = await this.getPaymentByEndToEndIdService.execute(data);

    if (!response) return null;

    return {
      id: response.id,
      state: response.state,
      endToEndId: response.endToEndId,
      txId: response.txId,
      value: response.value,
      createdAt: response.createdAt,
    };
  }
}
