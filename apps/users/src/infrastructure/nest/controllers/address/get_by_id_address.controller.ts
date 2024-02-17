import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  CacheTTL,
  InjectValidator,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
} from '@zro/common';
import { AddressRepository } from '@zro/users/domain';
import {
  GetAddressByIdController,
  GetAddressByIdRequest,
  GetAddressByIdResponse,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  AddressDatabaseRepository,
} from '@zro/users/infrastructure';

export type GetAddressByIdKafkaRequest = KafkaMessage<GetAddressByIdRequest>;
export type GetAddressByIdKafkaResponse = KafkaResponse<GetAddressByIdResponse>;

/**
 * Address RPC controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetAddressByIdMicroserviceController {
  /**
   * Default address RPC controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of get address by id.
   *
   * @param addressRepository Address repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ADDRESS.GET_BY_ID)
  async execute(
    @RepositoryParam(AddressDatabaseRepository)
    addressRepository: AddressRepository,
    @LoggerParam(GetAddressByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAddressByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAddressByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAddressByIdRequest(message);
    await this.validate(payload);

    logger.info('Getting address.', { id: payload.id });

    // Create and call get address by id controller.
    const controller = new GetAddressByIdController(logger, addressRepository);

    // Get address
    const address = await controller.execute(payload);

    logger.info('Address found.', { address });

    return {
      ctx,
      value: address,
    };
  }
}
