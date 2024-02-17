import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllBotOtcOrdersByFilterKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/otc-bot/infrastructure';
import {
  GetAllBotOtcOrdersByFilterRequest,
  GetAllBotOtcOrdersByFilterResponse,
} from '@zro/otc-bot/interface';
import { Logger } from 'winston';

// Service topic
const SERVICE = KAFKA_TOPICS.BOT_OTC_ORDER.GET_ALL_BY_FILTER;

/**
 * Bot otc orders microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllBotOtcOrdersByFilterServiceKafka {
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
      context: GetAllBotOtcOrdersByFilterServiceKafka.name,
    });
  }

  /**
   * Call bot otc order microservice to getAllByFilter.
   * @param payload Data.
   */
  async execute(
    payload: GetAllBotOtcOrdersByFilterRequest,
  ): Promise<GetAllBotOtcOrdersByFilterResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get bot otc orders by filter payload.', {
      payload,
    });

    // Request Kafka message.
    const data: GetAllBotOtcOrdersByFilterKafkaRequest = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call bot otc order microservice.
    const result = await this.kafkaService.send<
      GetAllBotOtcOrdersByFilterResponse,
      GetAllBotOtcOrdersByFilterKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get bot otc orders by filter message.', {
      result,
    });

    return result;
  }
}
