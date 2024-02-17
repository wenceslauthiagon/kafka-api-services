import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import {
  FeatureSetting,
  FeatureSettingEntity,
  FeatureSettingName,
} from '@zro/utils/domain';
import { UtilService } from '@zro/otc/application';
import { GetFeatureSettingByNameServiceKafka } from '@zro/utils/infrastructure';
import { GetFeatureSettingByNameRequest } from '@zro/utils/interface';

/**
 * Util microservice
 */
export class UtilServiceKafka implements UtilService {
  static _services: any[] = [GetFeatureSettingByNameServiceKafka];

  private readonly getFeatureSettingByNameService: GetFeatureSettingByNameServiceKafka;

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
    this.logger = logger.child({ context: UtilServiceKafka.name });

    this.getFeatureSettingByNameService =
      new GetFeatureSettingByNameServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  async getFeatureSettingByName(
    name: FeatureSettingName,
  ): Promise<FeatureSetting> {
    const request: GetFeatureSettingByNameRequest = {
      name,
    };

    const response = await this.getFeatureSettingByNameService.execute(request);

    if (!response) return null;

    return new FeatureSettingEntity({
      id: response.id,
      name: response.name,
      state: response.state,
    });
  }
}
