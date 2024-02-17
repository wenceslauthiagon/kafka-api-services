import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { UserService } from '@zro/reports/application';
import { GetUserByDocumentRequest } from '@zro/users/interface';
import { GetUserByDocumentServiceKafka } from '@zro/users/infrastructure';

/**
 * User microservice
 */
export class UserServiceKafka implements UserService {
  static _services: any[] = [GetUserByDocumentServiceKafka];

  private readonly getUserByDocumentService: GetUserByDocumentServiceKafka;

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

    this.getUserByDocumentService = new GetUserByDocumentServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Get user by document microservice.
   * @param request The user document.
   * @returns User if found or null otherwise.
   */
  async getUserByDocument(document: string): Promise<User> {
    const remote = new GetUserByDocumentRequest({ document });

    const response = await this.getUserByDocumentService.execute(remote);

    if (!response) return null;

    return new UserEntity({
      id: response.id,
      uuid: response.uuid,
      document: response.document,
      fullName: response.fullName,
      type: response.type,
    });
  }
}
