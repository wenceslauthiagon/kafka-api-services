import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetRemittanceByIdRequest,
  GetRemittanceByIdResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  GetRemittanceByIdKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * GetById Remittance.
 */
const SERVICE = KAFKA_TOPICS.REMITTANCE.GET_BY_ID;

@KafkaSubscribeService(SERVICE)
export class GetRemittanceByIdServiceKafka {
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
      context: GetRemittanceByIdServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetRemittanceByIdRequest,
  ): Promise<GetRemittanceByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetRemittanceByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('GetById remittance message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetRemittanceByIdResponse,
      GetRemittanceByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('GetById remittance message.', result);

    return result;
  }
}
