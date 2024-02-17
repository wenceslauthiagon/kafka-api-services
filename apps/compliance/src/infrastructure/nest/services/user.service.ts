import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { UserService } from '@zro/compliance/application';
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
   * Get a user by uuid.
   * @param request The user id.
   * @returns The user found.
   */
  async getByUuid(uuid: User['uuid']): Promise<User> {
    const response = await this.getUserByUuidService.execute({ uuid });

    if (!response) return null;

    return new UserEntity(response);
  }
}
