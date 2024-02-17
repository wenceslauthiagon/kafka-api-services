import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { PixDeposit } from '@zro/pix-payments/domain';
import { PixPaymentService } from '@zro/compliance/application';
import {
  ApprovePixDepositServiceKafka,
  BlockPixDepositServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  ApprovePixDepositRequest,
  BlockPixDepositRequest,
} from '@zro/pix-payments/interface';

/**
 * Pix payments microservice
 */
export class PixPaymentServiceKafka implements PixPaymentService {
  static _services: any[] = [
    ApprovePixDepositServiceKafka,
    BlockPixDepositServiceKafka,
  ];

  private readonly approvePixDepositService: ApprovePixDepositServiceKafka;
  private readonly blockPixDepositService: BlockPixDepositServiceKafka;

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

    this.approvePixDepositService = new ApprovePixDepositServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.blockPixDepositService = new BlockPixDepositServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  async approvePixDeposit(request: PixDeposit): Promise<void> {
    const data = new ApprovePixDepositRequest({
      operationId: request.operation.id,
    });

    await this.approvePixDepositService.execute(data);
  }

  async blockPixDeposit(request: PixDeposit): Promise<void> {
    const data = new BlockPixDepositRequest({
      operationId: request.operation.id,
    });

    await this.blockPixDepositService.execute(data);
  }
}
