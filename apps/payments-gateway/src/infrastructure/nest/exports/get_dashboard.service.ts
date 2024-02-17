import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetDashboardKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetDashboardRequest,
  GetDashboardResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.DASHBOARD.GET_ALL;

/**
 * Get dashboard microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetDashboardServiceKafka {
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
      context: GetDashboardServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetDashboard.
   * @param payload Data.
   */
  async execute(payload: GetDashboardRequest): Promise<GetDashboardResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetDashboardKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get dashboard message.', { data });

    // Call GetDashboard microservice.
    const result = await this.kafkaService.send<
      GetDashboardResponse,
      GetDashboardKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get dashboard message.', { result });

    return result;
  }
}
