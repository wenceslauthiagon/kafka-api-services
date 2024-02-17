import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { KafkaService } from '@zro/common';
import { ReportOperation } from '@zro/reports/domain';
import { ReportService } from '@zro/operations/application';
import { CreateReportOperationServiceKafka } from '@zro/reports/infrastructure';
import { CreateReportOperationRequest } from '@zro/reports/interface';

export class ReportServiceKafka implements ReportService {
  static _services: any[] = [CreateReportOperationServiceKafka];

  private readonly createReportOperationService: CreateReportOperationServiceKafka;

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

    this.createReportOperationService = new CreateReportOperationServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Create report operation.
   * @param operation Operation.
   * @returns Receipt of operation.
   */
  async createOperationReport(report: ReportOperation): Promise<void> {
    const {
      operation,
      operationType,
      transactionType,
      thirdPart,
      thirdPartBankCode,
      thirdPartBranch,
      thirdPartAccountNumber,
      client,
      clientBankCode,
      clientBranch,
      clientAccountNumber,
      currency,
    } = report;

    const request = new CreateReportOperationRequest({
      id: uuidV4(),
      operationId: operation.id,
      operationDate: operation.createdAt,
      operationValue: operation.value,
      operationType,
      transactionTypeId: transactionType.id,
      transactionTypeTag: transactionType.tag,
      transactionTypeTitle: transactionType.title,
      thirdPartId: thirdPart?.uuid,
      thirdPartName: thirdPart?.fullName,
      thirdPartDocument: thirdPart?.document,
      thirdPartDocumentType: thirdPart?.type,
      thirdPartBankCode,
      thirdPartBranch,
      thirdPartAccountNumber,
      clientId: client.uuid,
      clientName: client.fullName,
      clientDocument: client.document,
      clientDocumentType: client.type,
      clientBankCode,
      clientBranch,
      clientAccountNumber,
      currencySymbol: currency.symbol,
    });

    await this.createReportOperationService.execute(request);
  }
}
