import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  UpdateFeatureSettingStateKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/utils/infrastructure';
import {
  UpdateFeatureSettingStateRequest,
  UpdateFeatureSettingStateResponse,
} from '@zro/utils/interface';

const SERVICE = KAFKA_TOPICS.FEATURE_SETTING.UPDATE_STATE;

/**
 * Service to call update feature setting utils microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class UpdateFeatureSettingStateServiceKafka {
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
      context: UpdateFeatureSettingStateServiceKafka.name,
    });
  }

  /**
   * Call utils microservice to update feature setting.
   * @param payload Data.
   */
  async execute(
    payload: UpdateFeatureSettingStateRequest,
  ): Promise<UpdateFeatureSettingStateResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    //  Kafka message.
    const data: UpdateFeatureSettingStateKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send update feature setting state message.', {
      data,
    });

    // Call feature setting microservice.
    const result = await this.kafkaService.send<
      UpdateFeatureSettingStateResponse,
      UpdateFeatureSettingStateKafkaRequest
    >(SERVICE, data);

    logger.debug('Received update feature setting message.', {
      result,
    });

    return result;
  }
}
