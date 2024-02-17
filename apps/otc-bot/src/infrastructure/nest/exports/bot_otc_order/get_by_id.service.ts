import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetBotOtcOrderByIdKafkaRequest,
} from '@zro/otc-bot/infrastructure';
import {
  GetBotOtcOrderByIdRequest,
  GetBotOtcOrderByIdResponse,
} from '@zro/otc-bot/interface';
import { Logger } from 'winston';

// Service topic
const SERVICE = KAFKA_TOPICS.BOT_OTC_ORDER.GET_BY_ID;

@KafkaSubscribeService(SERVICE)
export class GetBotOtcOrderByIdServiceKafka {
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
      context: GetBotOtcOrderByIdServiceKafka.name,
    });
  }

  async execute(
    payload: GetBotOtcOrderByIdRequest,
  ): Promise<GetBotOtcOrderByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get bot otc order by id payload.', {
      payload,
    });

    // Request Kafka message.
    const data: GetBotOtcOrderByIdKafkaRequest = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call bot otc order microservice.
    const result = await this.kafkaService.send<
      GetBotOtcOrderByIdResponse,
      GetBotOtcOrderByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get bot otc order by id message.', {
      result,
    });

    return result;
  }
}
