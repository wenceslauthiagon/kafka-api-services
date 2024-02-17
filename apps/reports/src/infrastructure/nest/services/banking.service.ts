import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Operation, OperationEntity } from '@zro/operations/domain';
import {
  BankingTed,
  BankingTedEntity,
  BankingTedReceived,
  BankingTedReceivedEntity,
} from '@zro/banking/domain';
import { BankingService } from '@zro/reports/application';
import {
  GetBankingTedByOperationServiceKafka,
  GetBankingTedReceivedByOperationServiceKafka,
} from '@zro/banking/infrastructure';

/**
 * Banking microservice
 */
export class BankingServiceKafka implements BankingService {
  static _services: any[] = [
    GetBankingTedByOperationServiceKafka,
    GetBankingTedReceivedByOperationServiceKafka,
  ];

  private readonly getBankingTedReceivedByOperationService: GetBankingTedReceivedByOperationServiceKafka;
  private readonly getBankingTedByOperationService: GetBankingTedByOperationServiceKafka;

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
    this.logger = logger.child({ context: BankingServiceKafka.name });

    this.getBankingTedReceivedByOperationService =
      new GetBankingTedReceivedByOperationServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getBankingTedByOperationService =
      new GetBankingTedByOperationServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  /**
   * Get an BankingTedReceived by Operation.
   * @param operation Operation.
   * @returns BankingTedReceived found otherwise null.
   */
  async getBankingTedReceivedByOperation(
    operation: Operation,
  ): Promise<BankingTedReceived> {
    const result = await this.getBankingTedReceivedByOperationService.execute({
      operationId: operation.id,
    });

    const response =
      result &&
      new BankingTedReceivedEntity({
        id: result.id,
        operation: new OperationEntity({ id: result.operationId }),
        transactionId: result.transactionId,
        ownerName: result.ownerName,
        ownerDocument: result.ownerDocument,
        ownerBankAccount: result.ownerBankAccount,
        ownerBankBranch: result.ownerBankBranch,
        ownerBankCode: result.ownerBankCode,
        ownerBankName: result.ownerBankName,
        bankStatementId: result.bankStatementId,
        notifiedAt: result.notifiedAt,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      });

    return response;
  }

  /**
   * Get an BankingTed by Operation.
   * @param operation Operation.
   * @returns BankingTed found otherwise null.
   */
  async getBankingTedByOperation(operation: Operation): Promise<BankingTed> {
    const result = await this.getBankingTedByOperationService.execute({
      operationId: operation.id,
    });

    const response =
      result &&
      new BankingTedEntity({
        id: result.id,
        operation: new OperationEntity({ id: result.operationId }),
        state: result.state,
        amount: result.amount,
        beneficiaryBankName: result.beneficiaryBankName,
        beneficiaryBankCode: result.beneficiaryBankCode,
        beneficiaryName: result.beneficiaryName,
        beneficiaryType: result.beneficiaryType,
        beneficiaryDocument: result.beneficiaryDocument,
        beneficiaryAgency: result.beneficiaryAgency,
        beneficiaryAccount: result.beneficiaryAccount,
        beneficiaryAccountDigit: result.beneficiaryAccountDigit,
        beneficiaryAccountType: result.beneficiaryAccountType,
        transactionId: result.transactionId,
        confirmedAt: result.confirmedAt,
        failedAt: result.failedAt,
        createdAt: result.createdAt,
      });

    return response;
  }
}
