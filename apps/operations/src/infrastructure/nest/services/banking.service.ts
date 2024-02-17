import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation, Receipt, ReceiptEntity } from '@zro/operations/domain';
import { BankingService } from '@zro/operations/application';
import { GetBankingTedReceiptByUserAndOperationServiceKafka } from '@zro/banking/infrastructure';
import { GetBankingTedReceiptByUserAndOperationRequest } from '@zro/banking/interface';

/**
 * Banking microservice
 */
export class BankingServiceKafka implements BankingService {
  static _services: any[] = [
    GetBankingTedReceiptByUserAndOperationServiceKafka,
  ];

  private readonly getReceiptByUserAndOperationService: GetBankingTedReceiptByUserAndOperationServiceKafka;

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

    this.getReceiptByUserAndOperationService =
      new GetBankingTedReceiptByUserAndOperationServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  /**
   * Get payment receipt by user and operation.
   * @param user User.
   * @param operation Operation.
   * @returns Receipt of operation.
   */
  async getBankingTedReceipt(
    user: User,
    operation: Operation,
  ): Promise<Receipt> {
    const remote = new GetBankingTedReceiptByUserAndOperationRequest({
      userId: user.uuid,
      operationId: operation.id,
    });

    const response =
      await this.getReceiptByUserAndOperationService.execute(remote);

    return response && new ReceiptEntity(response);
  }
}
