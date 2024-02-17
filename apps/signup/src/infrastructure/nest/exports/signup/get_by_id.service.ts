import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetSignupByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/signup/infrastructure';
import {
  GetSignupByIdRequest,
  GetSignupByIdResponse,
} from '@zro/signup/interface';

/**
 * Service to call get signup by id at signup microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([KAFKA_TOPICS.SIGNUP.GET_BY_ID])
export class GetSignupByIdServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetSignupByIdServiceKafka.name,
    });
  }

  /**
   * Call signup microservice to get a signup by id.
   * @param payload Data.
   */
  async execute(payload: GetSignupByIdRequest): Promise<GetSignupByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetSignupByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get signup by id message.', { data });

    // Call signup microservice.
    const result = await this.kafkaService.send<
      GetSignupByIdResponse,
      GetSignupByIdKafkaRequest
    >(KAFKA_TOPICS.SIGNUP.GET_BY_ID, data);

    logger.debug('Received get signup by id message.', { result });

    return result;
  }
}
