import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { CryptoOrder, Remittance } from '@zro/otc/domain';
import { OtcBotService } from '@zro/otc/application';
import { UpdateBotOtcOrderByRemittanceRequest } from '@zro/otc-bot/interface';
import { UpdateBotOtcOrderByRemittanceServiceKafka } from '@zro/otc-bot/infrastructure';

/**
 * Otc-Bot microservice
 */
export class OtcBotServiceKafka implements OtcBotService {
  static _services: any[] = [UpdateBotOtcOrderByRemittanceServiceKafka];

  private readonly updateBotOtcOrderByRemittanceService: UpdateBotOtcOrderByRemittanceServiceKafka;

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
    this.logger = logger.child({ context: OtcBotServiceKafka.name });

    this.updateBotOtcOrderByRemittanceService =
      new UpdateBotOtcOrderByRemittanceServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  /**
   * Update Bot Otc order by remittance.
   * @param cryptoOrder Crypto Order.
   * @param remittance  Remittance.
   * @returns Onboarding if found or null otherwise.
   */
  async updateBotOtcOrderByRemittance(
    cryptoOrder: CryptoOrder,
    remittance: Remittance,
  ): Promise<void> {
    const request: UpdateBotOtcOrderByRemittanceRequest = {
      cryptoOrderId: cryptoOrder.id,
      remittanceId: remittance.id,
      remittanceBankQuote: remittance.bankQuote,
    };

    await this.updateBotOtcOrderByRemittanceService.execute(request);
  }
}
