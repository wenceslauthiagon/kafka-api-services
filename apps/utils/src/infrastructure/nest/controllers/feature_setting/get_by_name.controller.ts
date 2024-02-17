import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { FeatureSettingRepository } from '@zro/utils/domain';
import {
  GetFeatureSettingByNameRequest,
  GetFeatureSettingByNameController,
  GetFeatureSettingByNameResponse,
} from '@zro/utils/interface';
import {
  KAFKA_TOPICS,
  FeatureSettingDatabaseRepository,
} from '@zro/utils/infrastructure';

export type GetFeatureSettingByNameKafkaRequest =
  KafkaMessage<GetFeatureSettingByNameRequest>;

export type GetFeatureSettingByNameKafkaResponse =
  KafkaResponse<GetFeatureSettingByNameResponse>;

/**
 * Compliance RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetFeatureSettingByNameMicroserviceController {
  /**
   * Consumer of get setting request.
   *
   * @param message Kafka message.
   * @param featureSettingRepository FeatureSetting repository.
   * @param logger Logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.FEATURE_SETTING.GET_BY_NAME)
  async execute(
    @Payload('value') message: GetFeatureSettingByNameRequest,
    @RepositoryParam(FeatureSettingDatabaseRepository)
    featureSettingRepository: FeatureSettingRepository,
    @LoggerParam(GetFeatureSettingByNameMicroserviceController)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetFeatureSettingByNameKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new GetFeatureSettingByNameRequest(message);

    // Get and call get feature setting controller.
    const controller = new GetFeatureSettingByNameController(
      logger,
      featureSettingRepository,
    );

    // Get feature setting
    const featureSetting = await controller.execute(payload);

    logger.info('Feature setting returned.', { featureSetting });

    return {
      ctx,
      value: featureSetting,
    };
  }
}
