import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  UpdateRemittanceExposureRuleRequest,
  UpdateRemittanceExposureRuleResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  UpdateRemittanceExposureRuleKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * Update RemittanceExposureRule.
 */
const SERVICE = KAFKA_TOPICS.REMITTANCE_EXPOSURE_RULE.UPDATE;

@KafkaSubscribeService(SERVICE)
export class UpdateRemittanceExposureRuleServiceKafka {
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
      context: UpdateRemittanceExposureRuleServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: UpdateRemittanceExposureRuleRequest,
  ): Promise<UpdateRemittanceExposureRuleResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: UpdateRemittanceExposureRuleKafkaRequest = {
      key: payload.currencySymbol,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Update remittance exposure rule message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      UpdateRemittanceExposureRuleResponse,
      UpdateRemittanceExposureRuleKafkaRequest
    >(SERVICE, data);

    logger.debug('Updated remittance exposure rule message.', result);

    return result;
  }
}
