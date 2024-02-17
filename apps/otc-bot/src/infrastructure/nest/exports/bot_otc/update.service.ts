import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  UpdateBotOtcKafkaRequest,
} from '@zro/otc-bot/infrastructure';
import {
  UpdateBotOtcRequest,
  UpdateBotOtcResponse,
} from '@zro/otc-bot/interface';

const SERVICE = KAFKA_TOPICS.BOT_OTC.UPDATE;

@KafkaSubscribeService(SERVICE)
export class UpdateBotOtcServiceKafka {
  /**
   * Default constructor
   * @param requestId request ID.
   * @param logger Logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: UpdateBotOtcServiceKafka.name,
    });
  }

  /**
   * Call botOtc microservice to update the botOtc.
   * @param payload Data.
   */
  async execute(payload: UpdateBotOtcRequest): Promise<UpdateBotOtcResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    //Request Kafka message.

    const data: UpdateBotOtcKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send botOtc update message.', { data });

    // Call botOtc microservice.

    const result = await this.kafkaService.send<
      UpdateBotOtcResponse,
      UpdateBotOtcKafkaRequest
    >(SERVICE, data);

    logger.debug('Received botOtc update response.', { result });

    return result;
  }
}
