import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User } from '@zro/users/domain';
import { UserLimit } from '@zro/operations/domain';
import { UserLimitRequestService } from '@zro/compliance/application';
import { GetUserLimitByIdAndUserServiceKafka } from '@zro/operations/infrastructure';
import {
  GetUserLimitByIdAndUserRequest,
  GetUserLimitByIdAndUserResponse,
} from '@zro/operations/interface';

/**
 * User limit microservice
 */
export class UserLimitRequestServiceKafka implements UserLimitRequestService {
  static _services: any[] = [GetUserLimitByIdAndUserServiceKafka];

  private readonly getUserLimitService: GetUserLimitByIdAndUserServiceKafka;

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
    this.logger = logger.child({ context: UserLimitRequestServiceKafka.name });

    this.getUserLimitService = new GetUserLimitByIdAndUserServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Get user limit in microservice.
   * @param operation The key.
   * @param transactionTag String for construct operation.
   * @returns Created operation.
   */
  async getUserLimit(
    user: User,
    userLimit: UserLimit,
  ): Promise<GetUserLimitByIdAndUserResponse> {
    const request: GetUserLimitByIdAndUserRequest = {
      id: userLimit.id,
      userId: user.uuid,
    };

    const response: GetUserLimitByIdAndUserResponse =
      await this.getUserLimitService.execute(request);

    return response;
  }
}
