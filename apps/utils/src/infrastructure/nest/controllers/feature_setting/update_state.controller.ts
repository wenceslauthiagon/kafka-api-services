import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { FeatureSettingRepository } from '@zro/utils/domain';
import {
  UpdateFeatureSettingStateRequest,
  UpdateFeatureSettingStateController,
  UpdateFeatureSettingStateResponse,
  FeatureSettingEventEmitterControllerInterface,
} from '@zro/utils/interface';
import {
  KAFKA_TOPICS,
  FeatureSettingDatabaseRepository,
  FeatureSettingEventKafkaEmitter,
} from '@zro/utils/infrastructure';

export type UpdateFeatureSettingStateKafkaRequest =
  KafkaMessage<UpdateFeatureSettingStateRequest>;

export type UpdateFeatureSettingStateKafkaResponse =
  KafkaResponse<UpdateFeatureSettingStateResponse>;

/**
 * Compliance RPC controller.
 */
@Controller()
@MicroserviceController()
export class UpdateFeatureSettingStateMicroserviceController {
  /**
   * Consumer of update setting request.
   *
   * @param message Kafka message.
   * @param featureSettingRepository FeatureSetting repository.
   * @param logger Logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.FEATURE_SETTING.UPDATE_STATE)
  async execute(
    @Payload('value') message: UpdateFeatureSettingStateRequest,
    @RepositoryParam(FeatureSettingDatabaseRepository)
    featureSettingRepository: FeatureSettingRepository,
    @EventEmitterParam(FeatureSettingEventKafkaEmitter)
    featureSettingEventEmitter: FeatureSettingEventEmitterControllerInterface,
    @LoggerParam(UpdateFeatureSettingStateMicroserviceController)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateFeatureSettingStateKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new UpdateFeatureSettingStateRequest(message);

    // Call update feature setting controller.
    const controller = new UpdateFeatureSettingStateController(
      logger,
      featureSettingRepository,
      featureSettingEventEmitter,
    );

    // Update feature setting
    const featureSetting = await controller.execute(payload);

    logger.info('Feature setting updated.', { featureSetting });

    return {
      ctx,
      value: featureSetting,
    };
  }
}
