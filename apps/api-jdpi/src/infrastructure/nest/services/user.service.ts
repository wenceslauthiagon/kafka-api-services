import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Onboarding, UserEntity } from '@zro/users/domain';
import {
  UserService,
  GetUserByUuidServiceRequest,
  GetUserByUuidServiceResponse,
  GetOnboardingByAccountNumberAndStatusIsFinishedServiceResponse,
} from '@zro/api-jdpi/application';
import {
  GetOnboardingByAccountNumberAndStatusIsFinishedRequest,
  GetUserByUuidRequest,
} from '@zro/users/interface';
import {
  GetOnboardingByAccountNumberAndStatusIsFinishedServiceKafka,
  GetUserByUuidServiceKafka,
} from '@zro/users/infrastructure';

/**
 * User microservice
 */
export class UserServiceKafka implements UserService {
  static _services: any[] = [
    GetUserByUuidServiceKafka,
    GetOnboardingByAccountNumberAndStatusIsFinishedServiceKafka,
  ];

  private readonly getUserByUuidService: GetUserByUuidServiceKafka;
  private readonly getOnboardingByAccountNumberAndStatusIsFinishedService: GetOnboardingByAccountNumberAndStatusIsFinishedServiceKafka;

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

    this.getOnboardingByAccountNumberAndStatusIsFinishedService =
      new GetOnboardingByAccountNumberAndStatusIsFinishedServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  /**
   * Get onboarding by accountNumber microservice.
   * @param request The user accountNumber.
   * @returns Onboarding if found or null otherwise.
   */
  async getOnboardingByAccountNumberAndStatusIsFinished(
    accountNumber: Onboarding['accountNumber'],
  ): Promise<GetOnboardingByAccountNumberAndStatusIsFinishedServiceResponse> {
    const remote = new GetOnboardingByAccountNumberAndStatusIsFinishedRequest({
      accountNumber,
    });

    const response =
      await this.getOnboardingByAccountNumberAndStatusIsFinishedService.execute(
        remote,
      );

    if (!response) return null;

    return {
      id: response.id,
      user: new UserEntity({ uuid: response.userId }),
      status: response.status,
    };
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
      document: response.document,
      fullName: response.fullName,
      phoneNumber: response.phoneNumber,
      pin: response.pin,
      type: response.type,
      pinHasCreated: response.pinHasCreated,
      active: response.active,
    };
  }
}
