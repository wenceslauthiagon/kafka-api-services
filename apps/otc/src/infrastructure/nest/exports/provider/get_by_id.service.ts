import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetProviderByIdKafkaRequest,
} from '@zro/otc/infrastructure';
import {
  GetProviderByIdRequest,
  GetProviderByIdResponse,
} from '@zro/otc/interface';

/**
 * GetById provider.
 */
const SERVICE = KAFKA_TOPICS.PROVIDER.GET_BY_ID;

@KafkaSubscribeService(SERVICE)
export class GetProviderByIdServiceKafka {
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
    this.logger = logger.child({ context: GetProviderByIdServiceKafka.name });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetProviderByIdRequest,
  ): Promise<GetProviderByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetProviderByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get provider by id message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetProviderByIdResponse,
      GetProviderByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Get provider by id result.', { result });

    return result;
  }
}
