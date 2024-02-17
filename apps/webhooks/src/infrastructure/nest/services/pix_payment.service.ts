import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { OperationEntity } from '@zro/operations/domain';
import {
  Payment,
  PaymentEntity,
  PixDeposit,
  PixDepositEntity,
  PixDevolution,
  PixDevolutionEntity,
  PixDevolutionReceived,
  PixDevolutionReceivedEntity,
} from '@zro/pix-payments/domain';
import { PixPaymentService } from '@zro/webhooks/application';
import {
  GetPaymentByIdServiceKafka,
  GetPixDepositByIdServiceKafka,
  GetPixDevolutionByIdServiceKafka,
  GetPixDevolutionReceivedByIdServiceKafka,
} from '@zro/pix-payments/infrastructure';

/**
 * PixPayment microservice
 */
export class PixPaymentServiceKafka implements PixPaymentService {
  static _services: any[] = [
    GetPaymentByIdServiceKafka,
    GetPixDepositByIdServiceKafka,
    GetPixDevolutionByIdServiceKafka,
    GetPixDevolutionReceivedByIdServiceKafka,
  ];

  private readonly getPaymentByIdService: GetPaymentByIdServiceKafka;
  private readonly getPixDepositByIdService: GetPixDepositByIdServiceKafka;
  private readonly getPixDevolutionByIdService: GetPixDevolutionByIdServiceKafka;
  private readonly getPixDevolutionReceivedByIdService: GetPixDevolutionReceivedByIdServiceKafka;

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

    this.getPixDepositByIdService = new GetPixDepositByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getPixDevolutionByIdService = new GetPixDevolutionByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getPixDevolutionReceivedByIdService =
      new GetPixDevolutionReceivedByIdServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  /**
   * Get payment by id microservice.
   * @param request the id of payment.
   * @returns Payment if found or null otherwise.
   */

  async getById(id: string): Promise<Payment> {
    const response = await this.getPaymentByIdService.execute({ id });

    if (!response) return null;

    return new PaymentEntity({
      ...response,
      operation: new OperationEntity({ id: response.operationId }),
    });
  }

  async getDevolutionById(id: string): Promise<PixDevolution> {
    const response = await this.getPixDevolutionByIdService.execute({ id });

    if (!response) return null;

    return new PixDevolutionEntity({
      ...response,
      deposit: new PixDepositEntity({ id: response.depositId }),
      operation: new OperationEntity({ id: response.operationId }),
    });
  }

  async getDevolutionReceivedById(id: string): Promise<PixDevolutionReceived> {
    const response = await this.getPixDevolutionReceivedByIdService.execute({
      id,
    });

    if (!response) return null;

    return new PixDevolutionReceivedEntity(response);
  }

  async getPixDepositById(id: string): Promise<PixDeposit> {
    const response = await this.getPixDepositByIdService.execute({ id });

    if (!response) return null;

    return new PixDepositEntity(response);
  }
}
