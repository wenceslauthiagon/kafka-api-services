import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAddressByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  GetAddressByIdRequest,
  GetAddressByIdResponse,
} from '@zro/users/interface';

/**
 * Service to call get address by users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([KAFKA_TOPICS.ADDRESS.GET_BY_ID])
export class GetAddressByIdServiceKafka {
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
    this.logger = logger.child({
      context: GetAddressByIdServiceKafka.name,
    });
  }

  /**
   * Call get finished onboarding by cpf microservice.
   * @param request The user's UUID.
   * @returns Onboarding if found or null otherwise.
   */
  async execute(
    request: GetAddressByIdRequest,
  ): Promise<GetAddressByIdResponse> {
    // Request Kafka message.
    const data: GetAddressByIdKafkaRequest = {
      key: `${request.userId}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    this.logger.debug('Get address by id message.', { data });

    const result = await this.kafkaService.send<
      GetAddressByIdResponse,
      GetAddressByIdKafkaRequest
    >(KAFKA_TOPICS.ADDRESS.GET_BY_ID, data);

    this.logger.debug('Received address message.', { result });

    return (
      result && {
        id: result.id,
        city: result.city,
        street: result.street,
        zipCode: result.zipCode,
        federativeUnit: result.federativeUnit,
        createdAt: result.createdAt,
      }
    );
  }
}
