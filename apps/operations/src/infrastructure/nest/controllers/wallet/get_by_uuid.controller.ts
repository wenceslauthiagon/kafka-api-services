import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  CacheTTL,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { WalletRepository } from '@zro/operations/domain';
import {
  GetWalletByUuidController,
  GetWalletByUuidRequest,
  GetWalletByUuidResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetWalletByUuidKafkaRequest = KafkaMessage<GetWalletByUuidRequest>;
export type GetWalletByUuidKafkaResponse =
  KafkaResponse<GetWalletByUuidResponse>;

/**
 * Wallet controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetWalletByUuidMicroserviceController {
  /**
   * Consumer of get by uuid.
   *
   * @param walletRepositoryWallet repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET.GET_BY_UUID)
  async execute(
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @LoggerParam(GetWalletByUuidMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetWalletByUuidRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetWalletByUuidKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetWalletByUuidRequest(message);

    // Create and call get by uuid controller.
    const controller = new GetWalletByUuidController(logger, walletRepository);

    const wallet = await controller.execute(payload);

    logger.info('Wallet found.', { wallet });

    return {
      ctx,
      value: wallet,
    };
  }
}
