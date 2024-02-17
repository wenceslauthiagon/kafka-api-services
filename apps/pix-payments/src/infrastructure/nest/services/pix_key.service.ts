import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import {
  DecodedPixKey,
  DecodedPixKeyEntity,
  DecodedPixKeyState,
  PixKey,
  PixKeyEntity,
} from '@zro/pix-keys/domain';
import { User } from '@zro/users/domain';
import { PixKeyService } from '@zro/pix-payments/application';
import {
  GetByIdDecodedPixKeyServiceKafka,
  GetPixKeyByIdServiceKafka,
  GetPixKeyByKeyAndUserServiceKafka,
  UpdateStateByIdDecodedPixKeyServiceKafka,
} from '@zro/pix-keys/infrastructure';
import {
  GetByIdDecodedPixKeyRequest,
  GetByIdPixKeyRequest,
  GetPixKeyByKeyAndUserRequest,
  UpdateStateByIdDecodedPixKeyRequest,
} from '@zro/pix-keys/interface';

/**
 * PixKey microservice
 */
export class PixKeyServiceKafka implements PixKeyService {
  static _services: any[] = [
    GetByIdDecodedPixKeyServiceKafka,
    GetPixKeyByIdServiceKafka,
    GetPixKeyByKeyAndUserServiceKafka,
    UpdateStateByIdDecodedPixKeyServiceKafka,
  ];

  private readonly getPixKeyByIdService: GetPixKeyByIdServiceKafka;
  private readonly getPixKeyByKeyAndUserService: GetPixKeyByKeyAndUserServiceKafka;
  private readonly getByIdDecodedPixKeyService: GetByIdDecodedPixKeyServiceKafka;
  private readonly updateStateByIdDecodedPixKeyService: UpdateStateByIdDecodedPixKeyServiceKafka;

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
    this.logger = logger.child({ context: PixKeyServiceKafka.name });

    this.getPixKeyByIdService = new GetPixKeyByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getPixKeyByKeyAndUserService = new GetPixKeyByKeyAndUserServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getByIdDecodedPixKeyService = new GetByIdDecodedPixKeyServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.updateStateByIdDecodedPixKeyService =
      new UpdateStateByIdDecodedPixKeyServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  /**
   * Get key by id microservice.
   * @param pixKey The key.
   * @returns PixKey if found or null otherwise.
   */
  async getPixKeyByIdAndUser(pixKey: PixKey, user: User): Promise<PixKey> {
    const { id } = pixKey;

    // Request Kafka message.
    const data: GetByIdPixKeyRequest = {
      id,
      userId: user.uuid,
    };

    const response = await this.getPixKeyByIdService.execute(data);

    const result = response && new PixKeyEntity({ ...response, user });

    return result;
  }

  /**
   * Get key by key microservice.
   * @param pixKey The key.
   * @returns PixKey if found or null otherwise.
   */
  async getPixKeyByKeyAndUser(pixKey: PixKey, user: User): Promise<PixKey> {
    const { key } = pixKey;

    // Request Kafka message.
    const data: GetPixKeyByKeyAndUserRequest = {
      key,
      userId: user.uuid,
    };

    const response = await this.getPixKeyByKeyAndUserService.execute(data);

    const result = response && new PixKeyEntity({ ...response });

    return result;
  }

  /**
   * Get DecodedPixKey by id.
   * @param id The DecodedPixKey id.
   * @returns DecodedPixKey if found or null otherwise.
   */
  async getDecodedPixKeyById(id: string): Promise<DecodedPixKey> {
    // Request Kafka message.
    const data: GetByIdDecodedPixKeyRequest = {
      id,
    };

    const response = await this.getByIdDecodedPixKeyService.execute(data);

    const result = response && new DecodedPixKeyEntity(response);

    return result;
  }

  /**
   * Get DecodedPixKey by id.
   * @param id The DecodedPixKey id.
   * @param state The DecodedPixKey state.
   * @returns DecodedPixKey updated.
   */
  async updateDecodedPixKeyStateById(
    id: string,
    state: DecodedPixKeyState,
  ): Promise<DecodedPixKey> {
    // Request Kafka message.
    const data: UpdateStateByIdDecodedPixKeyRequest = {
      id,
      state,
    };

    const response =
      await this.updateStateByIdDecodedPixKeyService.execute(data);

    const result = response && new DecodedPixKeyEntity(response);

    return result;
  }
}
