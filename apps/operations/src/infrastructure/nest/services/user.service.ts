import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  UserService,
  GetUserByUuidRequest as GetUserByUuidInterfaceRequest,
  GetUserByUuidResponse as GetUserByUuidInterfaceResponse,
  GetUserByPhoneNumberRequest as GetUserByPhoneNumberInterfaceRequest,
  GetUserByPhoneNumberResponse as GetUserByPhoneNumberInterfaceResponse,
  GetUserByEmailRequest as GetUserByEmailInterfaceRequest,
  GetUserByEmailResponse as GetUserByEmailInterfaceResponse,
} from '@zro/operations/application';
import {
  GetUserByPhoneNumberRequest,
  GetUserByUuidRequest,
  GetUserByEmailRequest,
  GetUserByIdRequest,
} from '@zro/users/interface';
import {
  GetUserByEmailServiceKafka,
  GetUserByIdServiceKafka,
  GetUserByPhoneNumberServiceKafka,
  GetUserByUuidServiceKafka,
} from '@zro/users/infrastructure';

/**
 * User microservice
 */
export class UserServiceKafka implements UserService {
  static _services: any[] = [
    GetUserByUuidServiceKafka,
    GetUserByPhoneNumberServiceKafka,
    GetUserByEmailServiceKafka,
    GetUserByIdServiceKafka,
  ];

  private readonly getUserByUuidService: GetUserByUuidServiceKafka;
  private readonly getUserByPhoneNumberService: GetUserByPhoneNumberServiceKafka;
  private readonly getUserByEmailService: GetUserByEmailServiceKafka;
  private readonly getUserByIdService: GetUserByIdServiceKafka;

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

    this.getUserByPhoneNumberService = new GetUserByPhoneNumberServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getUserByEmailService = new GetUserByEmailServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getUserByIdService = new GetUserByIdServiceKafka(
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
    request: GetUserByUuidInterfaceRequest,
  ): Promise<GetUserByUuidInterfaceResponse> {
    const remote = new GetUserByUuidRequest({ uuid: request.userId });

    const response = await this.getUserByUuidService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      uuid: response.uuid,
      name: response.name,
      phoneNumber: response.phoneNumber,
      email: response.email,
    };
  }

  /**
   * Get user by phone number microservice.
   * @param request The user phone number.
   * @returns User if found or null otherwise.
   */
  async getUserByPhoneNumber(
    request: GetUserByPhoneNumberInterfaceRequest,
  ): Promise<GetUserByPhoneNumberInterfaceResponse> {
    const remote = new GetUserByPhoneNumberRequest({
      phoneNumber: request.phoneNumber,
    });

    const response = await this.getUserByPhoneNumberService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      uuid: response.uuid,
    };
  }

  /**
   * Get user by email microservice.
   * @param request The user email.
   * @returns User if found or null otherwise.
   */
  async getUserByEmail(
    request: GetUserByEmailInterfaceRequest,
  ): Promise<GetUserByEmailInterfaceResponse> {
    const remote = new GetUserByEmailRequest({
      email: request.email,
    });

    const response = await this.getUserByEmailService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      uuid: response.uuid,
    };
  }

  /**
   * Get user by id.
   * @param request The user id.
   * @returns User if found or null otherwise.
   */
  async getUserById(request: User['id']): Promise<User> {
    const remote = new GetUserByIdRequest({ id: request });

    const response = await this.getUserByIdService.execute(remote);

    if (!response) return null;

    return new UserEntity(response);
  }
}
