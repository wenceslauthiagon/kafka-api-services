import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserByDocumentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  GetUserByDocumentRequest,
  GetUserByDocumentResponse,
} from '@zro/users/interface';

/**
 * Service to call get user by cpf at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService([KAFKA_TOPICS.USER.GET_BY_DOCUMENT])
export class GetUserByDocumentServiceKafka {
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
    this.logger = logger.child({ context: GetUserByDocumentServiceKafka.name });
  }

  /**
   * Call get user by cpf microservice.
   * @param request The user's UUID.
   * @returns User if found or null otherwise.
   */
  async execute(
    request: GetUserByDocumentRequest,
  ): Promise<GetUserByDocumentResponse> {
    // Create request Kafka message.
    const data: GetUserByDocumentKafkaRequest = {
      key: `${request.document}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    this.logger.debug('Get user by document message.', { data });

    // Call get user by cpf microservice.
    const result = await this.kafkaService.send<
      GetUserByDocumentResponse,
      GetUserByDocumentKafkaRequest
    >(KAFKA_TOPICS.USER.GET_BY_DOCUMENT, data);

    this.logger.debug('Received user message.', { result });

    // If no user found.
    if (!result) return null;

    return result;
  }
}
