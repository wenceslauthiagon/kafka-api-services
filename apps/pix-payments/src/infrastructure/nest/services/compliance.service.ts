import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Operation } from '@zro/operations/domain';
import { WarningTransaction } from '@zro/compliance/domain';
import { ComplianceService } from '@zro/pix-payments/application';
import {
  CreateWarningTransactionServiceKafka,
  GetWarningTransactionByOperationServiceKafka,
} from '@zro/compliance/infrastructure';
import {
  CreateWarningTransactionRequest,
  GetWarningTransactionByOperationRequest,
  GetWarningTransactionByOperationResponse,
} from '@zro/compliance/interface';

/**
 * Compliance microservice
 */
export class ComplianceServiceKafka implements ComplianceService {
  static _services: any[] = [
    CreateWarningTransactionServiceKafka,
    GetWarningTransactionByOperationServiceKafka,
  ];

  private readonly createWarningTransactionService: CreateWarningTransactionServiceKafka;
  private readonly getWarningTransactionByOperationService: GetWarningTransactionByOperationServiceKafka;

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
    this.logger = logger.child({ context: ComplianceServiceKafka.name });

    this.createWarningTransactionService =
      new CreateWarningTransactionServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getWarningTransactionByOperationService =
      new GetWarningTransactionByOperationServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  async getWarningTransactionByOperation(
    operation: Operation,
  ): Promise<GetWarningTransactionByOperationResponse> {
    const data = new GetWarningTransactionByOperationRequest({
      operationId: operation.id,
    });

    return this.getWarningTransactionByOperationService.execute(data);
  }

  async createWarningTransaction(request: WarningTransaction): Promise<void> {
    const data = new CreateWarningTransactionRequest({
      operationId: request.operation.id,
      transactionTag: request.transactionTag,
      endToEndId: request.endToEndId,
      reason: request.reason,
    });

    await this.createWarningTransactionService.execute(data);
  }
}
