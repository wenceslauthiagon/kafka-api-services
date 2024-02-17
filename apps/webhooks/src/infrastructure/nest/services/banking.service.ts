import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Bank, BankEntity } from '@zro/banking/domain';
import { BankingService } from '@zro/webhooks/application';
import { GetBankByIdServiceKafka } from '@zro/banking/infrastructure';

/**
 * Banking microservice
 */
export class BankingServiceKafka implements BankingService {
  static _services: any[] = [GetBankByIdServiceKafka];

  private readonly getBankingByIdService: GetBankByIdServiceKafka;

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

    this.getBankingByIdService = new GetBankByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Get bank by id microservice.
   * @param request the id of bank.
   * @returns Banking if found or null otherwise.
   */

  async getById(id: string): Promise<Bank> {
    const response = await this.getBankingByIdService.execute({ id });

    if (!response) return null;

    return new BankEntity({ ...response });
  }
}
