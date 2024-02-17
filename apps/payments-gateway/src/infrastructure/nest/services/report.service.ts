import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { KafkaService } from '@zro/common';
import { ReportOperation } from '@zro/reports/domain';
import { ReportService } from '@zro/payments-gateway/application';
import { CreateReportOperationByGatewayRequest } from '@zro/reports/interface';
import { CreateReportOperationByGatewayServiceKafka } from '@zro/reports/infrastructure';

/**
 * Report microservice.
 */
export class ReportServiceKafka implements ReportService {
  static _services: any[] = [CreateReportOperationByGatewayServiceKafka];

  private readonly createReportOperationService: CreateReportOperationByGatewayServiceKafka;

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
    this.logger = logger.child({ context: ReportServiceKafka.name });
    this.createReportOperationService =
      new CreateReportOperationByGatewayServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  async createReportOperation(request: ReportOperation): Promise<void> {
    const {
      operation,
      operationType,
      transactionType,
      thirdPart,
      client,
      clientBankCode,
      clientBranch,
      clientAccountNumber,
      currency,
    } = request;

    const data = new CreateReportOperationByGatewayRequest({
      id: uuidV4(),
      operationId: operation.id,
      operationDate: operation.createdAt,
      operationValue: operation.value,
      operationType,
      transactionTypeTag: transactionType.tag,
      thirdPartName: thirdPart.name,
      thirdPartDocument: thirdPart.document,
      thirdPartDocumentType: thirdPart.type,
      clientName: client.name,
      clientDocument: client.document,
      clientDocumentType: client.type,
      clientBankCode,
      clientBranch,
      clientAccountNumber,
      currencySymbol: currency.symbol,
    });

    await this.createReportOperationService.execute(data);
  }
}
