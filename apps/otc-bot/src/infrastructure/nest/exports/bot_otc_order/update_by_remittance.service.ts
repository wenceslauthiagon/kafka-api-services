import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  UpdateBotOtcOrderByRemittanceKafkaRequest,
} from '@zro/otc-bot/infrastructure';
import { UpdateBotOtcOrderByRemittanceRequest } from '@zro/otc-bot/interface';

/**
 * Update BotOtcOrder by Remittance.
 */
const SERVICE = KAFKA_TOPICS.BOT_OTC_ORDER.UPDATE_BY_REMITTANCE;

@KafkaSubscribeService(SERVICE)
export class UpdateBotOtcOrderByRemittanceServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: UpdateBotOtcOrderByRemittanceServiceKafka.name,
    });
  }

  /**
   * Call otc-bot microservice
   * @param payload Data.
   */
  async execute(payload: UpdateBotOtcOrderByRemittanceRequest): Promise<void> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: UpdateBotOtcOrderByRemittanceKafkaRequest = {
      key: payload.cryptoOrderId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Update botOtcOrder by remittance message.', { data });

    await this.kafkaService.send<UpdateBotOtcOrderByRemittanceKafkaRequest>(
      SERVICE,
      data,
    );

    logger.debug('Updated botOtcOrder by remittance message.');
  }
}
