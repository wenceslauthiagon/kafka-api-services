import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { AddressEntity, User, UserEntity } from '@zro/users/domain';
import {
  UserService,
  GetAddressByIdServiceResponse,
  GetAddressByIdServiceRequest,
  GetUserByUuidServiceRequest,
  GetUserByUuidServiceResponse,
  GetOnboardingByUserAndStatusIsFinishedServiceResponse,
  GetOnboardingByDocumentAndStatusIsFinishedServiceRequest,
  GetOnboardingByDocumentAndStatusIsFinishedServiceResponse,
  GetUserByDocumentServiceRequest,
  GetUserByDocumentServiceResponse,
} from '@zro/pix-payments/application';
import {
  GetAddressByIdRequest,
  GetOnboardingByUserAndStatusIsFinishedRequest,
  GetOnboardingByDocumentAndStatusIsFinishedRequest,
  GetUserByUuidRequest,
  GetUserByDocumentRequest,
} from '@zro/users/interface';
import {
  GetOnboardingByDocumentAndStatusIsFinishedServiceKafka,
  GetUserByUuidServiceKafka,
  GetOnboardingByUserAndStatusIsFinishedServiceKafka,
  GetAddressByIdServiceKafka,
  GetUserByDocumentServiceKafka,
} from '@zro/users/infrastructure';

/**
 * User microservice
 */
export class UserServiceKafka implements UserService {
  static _services: any[] = [
    GetOnboardingByDocumentAndStatusIsFinishedServiceKafka,
    GetUserByUuidServiceKafka,
    GetOnboardingByUserAndStatusIsFinishedServiceKafka,
    GetAddressByIdServiceKafka,
    GetUserByDocumentServiceKafka,
  ];

  private readonly getAddressBydIdService: GetAddressByIdServiceKafka;
  private readonly getUserByUuidService: GetUserByUuidServiceKafka;
  private readonly getOnboardingByUserAndStatusIsFinishedService: GetOnboardingByUserAndStatusIsFinishedServiceKafka;
  private readonly getOnboardingByCpfAndStatusIsFinishedService: GetOnboardingByDocumentAndStatusIsFinishedServiceKafka;
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

    this.getUserByUuidService = new GetUserByUuidServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getAddressBydIdService = new GetAddressByIdServiceKafka(
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

    this.getOnboardingByCpfAndStatusIsFinishedService =
      new GetOnboardingByDocumentAndStatusIsFinishedServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getUserByDocumentService = new GetUserByDocumentServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Get address by id microservice.
   * @param request The address.
   * @returns Address if found or null otherwise.
   */
  async getAddressById(
    request: GetAddressByIdServiceRequest,
  ): Promise<GetAddressByIdServiceResponse> {
    const remote = new GetAddressByIdRequest({
      userId: request.user.uuid,
      id: request.id,
    });

    const response = await this.getAddressBydIdService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      city: response.city,
      street: response.street,
      zipCode: response.zipCode,
      federativeUnit: response.federativeUnit,
    };
  }

  /**
   * Get onboarding by user microservice.
   * @param request The user.
   * @returns Onboarding if found or null otherwise.
   */
  async getOnboardingByUserAndStatusIsFinished(
    user: User,
  ): Promise<GetOnboardingByUserAndStatusIsFinishedServiceResponse> {
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
      address:
        response.addressId && new AddressEntity({ id: response.addressId }),
      fullName: response.fullName,
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
      pinHasCreated: response.pinHasCreated,
      active: response.active,
      type: response.type,
    };
  }

  /**
   * Get onboarding by user cpf;
   * @returns Onboarding if found or null otherwise.
   */
  async getOnboardingByCpfAndStatusIsFinished(
    request: GetOnboardingByDocumentAndStatusIsFinishedServiceRequest,
  ): Promise<GetOnboardingByDocumentAndStatusIsFinishedServiceResponse> {
    const remote = new GetOnboardingByDocumentAndStatusIsFinishedRequest({
      document: request.document,
    });

    const response =
      await this.getOnboardingByCpfAndStatusIsFinishedService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      status: response.status,
      fullName: response.fullName,
      user: new UserEntity({ uuid: response.userId }),
    };
  }

  /**
   * Get user by document microservice.
   * @param request The user document.
   * @returns User if found or null otherwise.
   */
  async getUserByDocument(
    request: GetUserByDocumentServiceRequest,
  ): Promise<GetUserByDocumentServiceResponse> {
    const remote = new GetUserByDocumentRequest({ document: request.document });

    const response = await this.getUserByDocumentService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      uuid: response.uuid,
      document: response.document,
      fullName: response.fullName,
      phoneNumber: response.phoneNumber,
      pin: response.pin,
      pinHasCreated: response.pinHasCreated,
      active: response.active,
      type: response.type,
    };
  }
}
