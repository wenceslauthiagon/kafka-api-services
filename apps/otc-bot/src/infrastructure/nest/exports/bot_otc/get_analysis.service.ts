import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetBotOtcAnalysisKafkaRequest,
} from '@zro/otc-bot/infrastructure';
import {
  GetBotOtcAnalysisRequest,
  GetBotOtcAnalysisResponse,
} from '@zro/otc-bot/interface';

/**
 * Get bot otc analysis.
 */
const SERVICE = KAFKA_TOPICS.BOT_OTC.GET_ANALYSIS;

@KafkaSubscribeService(SERVICE)
export class GetBotOtcAnalysisServiceKafka {
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
      context: GetBotOtcAnalysisServiceKafka.name,
    });
  }

  /**
   * Call otc-bot microservice
   * @param payload Data.
   */
  async execute(
    payload: GetBotOtcAnalysisRequest,
  ): Promise<GetBotOtcAnalysisResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetBotOtcAnalysisKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get bot otc analysis message.', { data });

    const result = await this.kafkaService.send<
      GetBotOtcAnalysisResponse,
      GetBotOtcAnalysisKafkaRequest
    >(SERVICE, data);

    logger.debug('Get bot otc analysis response message.', result);

    return result;
  }
}
