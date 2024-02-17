import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import {
  UserService,
  CreateUserRequest,
  CreateUserResponse,
  GetUserByEmailRequest as GetUserByEmailInterfaceRequest,
  GetUserByEmailResponse as GetUserByEmailInterfaceResponse,
} from '@zro/signup/application';
import {
  CreateUserServiceKafka,
  GetUserByEmailServiceKafka,
} from '@zro/users/infrastructure';
import { GetUserByEmailRequest } from '@zro/users/interface';

/**
 * Users microservice
 */
export class UserServiceKafka implements UserService {
  static _services: any[] = [
    CreateUserServiceKafka,
    GetUserByEmailServiceKafka,
  ];

  private readonly createUserService: CreateUserServiceKafka;
  private readonly getUserByEmailService: GetUserByEmailServiceKafka;

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

    this.createUserService = new CreateUserServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getUserByEmailService = new GetUserByEmailServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Create user at users microservice.
   * @param request The body.
   */
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    const response = await this.createUserService.execute({
      id: request.id,
      phoneNumber: request.phoneNumber,
      name: request.name,
      referralCode: request.referralCode,
      password: request.password,
      confirmCode: request.confirmCode,
      email: request.email,
    });

    return {
      id: response.id,
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
}
