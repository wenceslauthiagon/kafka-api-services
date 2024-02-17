import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  UserService,
  GetUserByUuidRequest as GetUserByUuidApplicationRequest,
  GetUserByUuidResponse as GetUserByUuidApplicationResponse,
  GetOnboardingByUserAndStatusIsFinishedResponse as GetOnboardingByUserAndStatusIsFinishedApplicationResponse,
} from '@zro/pix-keys/application';
import {
  GetOnboardingByUserAndStatusIsFinishedServiceKafka,
  GetUserByUuidServiceKafka,
} from '@zro/users/infrastructure';
import {
  GetOnboardingByUserAndStatusIsFinishedRequest,
  GetUserByUuidRequest,
} from '@zro/users/interface';

/**
 * User microservice
 */
export class UserServiceKafka implements UserService {
  static _services: any[] = [
    GetUserByUuidServiceKafka,
    GetOnboardingByUserAndStatusIsFinishedServiceKafka,
  ];

  private readonly getUserByUuidService: GetUserByUuidServiceKafka;
  private readonly getOnboardingByUserAndStatusIsFinishedService: GetOnboardingByUserAndStatusIsFinishedServiceKafka;

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

    this.getOnboardingByUserAndStatusIsFinishedService =
      new GetOnboardingByUserAndStatusIsFinishedServiceKafka(
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
    request: GetUserByUuidApplicationRequest,
  ): Promise<GetUserByUuidApplicationResponse> {
    const remote = new GetUserByUuidRequest({ uuid: request.uuid });

    const response = await this.getUserByUuidService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      uuid: response.uuid,
      document: response.document,
      fullName: response.fullName,
      active: response.active,
      type: response.type,
    };
  }

  /**
   * Get onboarding by user microservice.
   * @param request The user id.
   * @returns Onboarding if found or null otherwise.
   */
  async getOnboardingByUserAndStatusIsFinished(
    user: User,
  ): Promise<GetOnboardingByUserAndStatusIsFinishedApplicationResponse> {
    const remote = new GetOnboardingByUserAndStatusIsFinishedRequest({
      userId: user.uuid,
    });

    const response =
      await this.getOnboardingByUserAndStatusIsFinishedService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      status: response.status,
      user: new UserEntity({ uuid: response.userId }),
      branch: response.branch,
      accountNumber: response.accountNumber,
      updatedAt: response.updatedAt,
      fullName: response.fullName,
    };
  }
}
