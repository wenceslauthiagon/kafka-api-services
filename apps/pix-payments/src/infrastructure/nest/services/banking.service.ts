import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Bank, BankEntity } from '@zro/banking/domain';
import { BankingService } from '@zro/pix-payments/application';
import { GetBankByIspbServiceKafka } from '@zro/banking/infrastructure';
import { GetBankByIspbRequest } from '@zro/banking/interface';

/**
 * Banking microservice
 */
export class BankingServiceKafka implements BankingService {
  static _services: any[] = [GetBankByIspbServiceKafka];

  private readonly getBankByIspbService: GetBankByIspbServiceKafka;

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
    this.getBankByIspbService = new GetBankByIspbServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  async getBankByIspb(ispb: string): Promise<Bank> {
    const data = new GetBankByIspbRequest({ ispb });

    const response = await this.getBankByIspbService.execute(data);

    if (!response) return null;

    return new BankEntity(response);
  }
}
