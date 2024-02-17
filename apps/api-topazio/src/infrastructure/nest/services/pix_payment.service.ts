import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { WalletEntity } from '@zro/operations/domain';
import {
  Payment,
  PixDeposit,
  PixDevolution,
  PixDevolutionReceived,
} from '@zro/pix-payments/domain';
import {
  PixPaymentService,
  ReceivePixDepositResponse,
  ReceivePixDevolutionReceivedResponse,
  GetPixDevolutionByIdResponse,
  GetPaymentByIdResponse,
  ReceivePixDevolutionChargebackResponse,
  ReceivePixPaymentChargebackResponse,
} from '@zro/api-topazio/application';
import {
  GetPaymentByIdServiceKafka,
  ReceivePixDepositServiceKafka,
  GetPixDevolutionByIdServiceKafka,
  ReceivePixDevolutionReceivedServiceKafka,
  ReceivePaymentChargebackServiceKafka,
  ReceivePixDevolutionChargebackServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  GetPaymentByIdRequest,
  ReceivePixDepositRequest,
  GetPixDevolutionByIdRequest,
  ReceivePixDevolutionReceivedRequest,
  ReceivePaymentChargebackRequest,
  ReceivePixDevolutionChargebackRequest,
} from '@zro/pix-payments/interface';

/**
 * Pix payment microservice.
 */
export class PixPaymentServiceKafka implements PixPaymentService {
  static _services: any[] = [
    GetPaymentByIdServiceKafka,
    ReceivePixDepositServiceKafka,
    GetPixDevolutionByIdServiceKafka,
    ReceivePixDevolutionReceivedServiceKafka,
    ReceivePaymentChargebackServiceKafka,
    ReceivePixDevolutionChargebackServiceKafka,
  ];

  private readonly getPaymentByIdService: GetPaymentByIdServiceKafka;
  private readonly getPixDevolutionByIdService: GetPixDevolutionByIdServiceKafka;
  private readonly receivePixDepositService: ReceivePixDepositServiceKafka;
  private readonly receivePixDevolutionReceivedService: ReceivePixDevolutionReceivedServiceKafka;
  private readonly receivePaymentChargebackService: ReceivePaymentChargebackServiceKafka;
  private readonly receivePixDevolutionChargebackService: ReceivePixDevolutionChargebackServiceKafka;

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
    this.getPaymentByIdService = new GetPaymentByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
    this.getPixDevolutionByIdService = new GetPixDevolutionByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
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
    this.receivePaymentChargebackService =
      new ReceivePaymentChargebackServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
    this.receivePixDevolutionChargebackService =
      new ReceivePixDevolutionChargebackServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  /**
   * Get payment by uuid.
   * @param id The user uuid.
   * @returns Payment if found or null otherwise.
   */
  async getPixPaymentById(id: string): Promise<GetPaymentByIdResponse> {
    const data = new GetPaymentByIdRequest({ id });

    const response = await this.getPaymentByIdService.execute(data);

    if (!response) return null;

    return {
      id: response.id,
      state: response.state,
      user: new UserEntity({ uuid: response.userId }),
      wallet: new WalletEntity({ uuid: response.walletId }),
      createdAt: response.createdAt,
    };
  }

  /**
   * Get pixDevolution by uuid.
   * @param id The user uuid.
   * @returns PixDevolution if found or null otherwise.
   */
  async getPixDevolutionById(
    id: string,
  ): Promise<GetPixDevolutionByIdResponse> {
    const data = new GetPixDevolutionByIdRequest({ id });

    const response = await this.getPixDevolutionByIdService.execute(data);

    if (!response) return null;

    return {
      id: response.id,
      state: response.state,
      user: new UserEntity({ uuid: response.userId }),
      wallet: new WalletEntity({ uuid: response.walletId }),
      createdAt: response.createdAt,
    };
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
      paymentId: request.payment.id,
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

    return {
      id: response.id,
      state: response.state,
      createdAt: response.createdAt,
    };
  }

  async receivePixPaymentChargeback(
    request: Payment,
  ): Promise<ReceivePixPaymentChargebackResponse> {
    const data = new ReceivePaymentChargebackRequest({
      id: request.id,
      chargebackReason: request.chargebackReason,
    });

    const response = await this.receivePaymentChargebackService.execute(data);

    return {
      id: response.id,
      state: response.state,
      createdAt: response.createdAt,
    };
  }

  async receivePixDevolutionChargeback(
    request: PixDevolution,
  ): Promise<ReceivePixDevolutionChargebackResponse> {
    const data = new ReceivePixDevolutionChargebackRequest({
      id: request.id,
      chargebackReason: request.chargebackReason,
    });

    const response =
      await this.receivePixDevolutionChargebackService.execute(data);

    return {
      id: response.id,
      state: response.state,
      createdAt: response.createdAt,
    };
  }
}
