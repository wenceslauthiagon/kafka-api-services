import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Operation,
  Receipt,
  ReceiptEntity,
  Wallet,
} from '@zro/operations/domain';
import { PixPaymentsService } from '@zro/operations/application';
import { GetReceiptByOperationIdServiceKafka } from '@zro/pix-payments/infrastructure';
import { GetReceiptByOperationIdRequest } from '@zro/pix-payments/interface';

/**
 * PixPayments microservice
 */
export class PixPaymentsServiceKafka implements PixPaymentsService {
  static _services: any[] = [GetReceiptByOperationIdServiceKafka];

  private readonly getReceiptOperationService: GetReceiptByOperationIdServiceKafka;

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
    this.logger = logger.child({ context: PixPaymentsServiceKafka.name });

    this.getReceiptOperationService = new GetReceiptByOperationIdServiceKafka(
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
  async getPaymentReceipt(
    user: User,
    wallet: Wallet,
    operation: Operation,
  ): Promise<Receipt> {
    const remote = new GetReceiptByOperationIdRequest({
      userId: user.uuid,
      walletId: wallet.uuid,
      operationId: operation.id,
    });

    const response = await this.getReceiptOperationService.execute(remote);

    return response && new ReceiptEntity(response);
  }
}
