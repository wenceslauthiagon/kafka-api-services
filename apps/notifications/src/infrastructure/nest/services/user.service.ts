import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import {
  UserService,
  GetUserByUuidServiceRequest,
  GetUserByUuidServiceResponse,
} from '@zro/notifications/application';
import { GetUserByUuidRequest } from '@zro/users/interface';
import { GetUserByUuidServiceKafka } from '@zro/users/infrastructure';

/**
 * User microservice
 */
export class UserServiceKafka implements UserService {
  static _services: any[] = [GetUserByUuidServiceKafka];

  private readonly getUserByUuidService: GetUserByUuidServiceKafka;

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
    this.logger = logger.child({ context: UserServiceKafka.name });

    this.getUserByUuidService = new GetUserByUuidServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Get user by uuid microservice.
   * @param request The user uuid.
   * @returns User if found or null otherwise.
   */
  async getUserByUuid(
    request: GetUserByUuidServiceRequest,
  ): Promise<GetUserByUuidServiceResponse> {
    const remote = new GetUserByUuidRequest({ uuid: request.uuid });

    const response = await this.getUserByUuidService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      uuid: response.uuid,
      active: response.active,
      fcmToken: response.fcmToken,
    };
  }
}
