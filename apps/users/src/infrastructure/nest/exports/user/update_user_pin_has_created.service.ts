import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  UpdateUserPinHasCreatedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import { UpdateUserPinHasCreatedRequest } from '@zro/users/interface';

const SERVICE = KAFKA_TOPICS.USER.UPDATE_USER_PIN_HAS_CREATED;

/**
 * Service to call update user pin has created at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class UpdateUserPinHasCreatedServiceKafka {
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
      context: UpdateUserPinHasCreatedServiceKafka.name,
    });
  }

  /**
   * Call update user pin has created microservice.
   * @param request The user's UUID.
   * @returns User if found or null otherwise.
   */
  async execute(request: UpdateUserPinHasCreatedRequest): Promise<void> {
    // Create request Kafka message.
    const data: UpdateUserPinHasCreatedKafkaRequest = {
      key: `${request.uuid}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    this.logger.debug('Update user pin has created message.', { data });

    // Call update user pin has created microservice.
    await this.kafkaService.send<UpdateUserPinHasCreatedKafkaRequest>(
      SERVICE,
      data,
    );

    this.logger.debug('Received user message.');
  }
}
