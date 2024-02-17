import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetFeatureSettingByNameKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/utils/infrastructure';
import {
  GetFeatureSettingByNameRequest,
  GetFeatureSettingByNameResponse,
} from '@zro/utils/interface';

const SERVICE = KAFKA_TOPICS.FEATURE_SETTING.GET_BY_NAME;

/**
 * Service to call get feature setting utils microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class GetFeatureSettingByNameServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Feature logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetFeatureSettingByNameServiceKafka.name,
    });
  }

  /**
   * Call utils microservice to get feature setting.
   * @param payload Data.
   */
  async execute(
    payload: GetFeatureSettingByNameRequest,
  ): Promise<GetFeatureSettingByNameResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    //  Kafka message.
    const data: GetFeatureSettingByNameKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get feature setting by name message.', {
      data,
    });

    // Call feature setting microservice.
    const result = await this.kafkaService.send<
      GetFeatureSettingByNameResponse,
      GetFeatureSettingByNameKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get feature setting message.', {
      result,
    });

    return result;
  }
}
