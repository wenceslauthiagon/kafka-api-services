import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllRemittanceExposureRuleRequest,
  GetAllRemittanceExposureRuleResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  GetAllRemittanceExposureRuleKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * Get all RemittanceExposureRule.
 */
const SERVICE = KAFKA_TOPICS.REMITTANCE_EXPOSURE_RULE.GET_ALL;

@KafkaSubscribeService(SERVICE)
export class GetAllRemittanceExposureRuleServiceKafka {
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
      context: GetAllRemittanceExposureRuleServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetAllRemittanceExposureRuleRequest,
  ): Promise<GetAllRemittanceExposureRuleResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllRemittanceExposureRuleKafkaRequest = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get all remittance exposure rule message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetAllRemittanceExposureRuleResponse,
      GetAllRemittanceExposureRuleKafkaRequest
    >(SERVICE, data);

    logger.debug('Get all remittance exposure rules message.', result);

    return result;
  }
}
