import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { WalletRepository } from '@zro/operations/domain';
import {
  GetAllWalletByUserController,
  GetAllWalletByUserRequest,
  GetAllWalletByUserResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetAllWalletByUserKafkaRequest =
  KafkaMessage<GetAllWalletByUserRequest>;

export type GetAllWalletByUserKafkaResponse = KafkaResponse<
  GetAllWalletByUserResponse[]
>;

/**
 * Walletcontroller.
 */
@Controller()
@MicroserviceController()
export class GetAllWalletByUserMicroserviceController {
  /**
   * Consumer of get Wallets.
   *
   * @param walletRepository Walletrepository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET.GET_ALL_BY_USER)
  async execute(
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @LoggerParam(GetAllWalletByUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllWalletByUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllWalletByUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllWalletByUserRequest(message);

    // Create and call get Wallets controller.
    const controller = new GetAllWalletByUserController(
      logger,
      walletRepository,
    );

    // Get all wallets
    const wallets = await controller.execute(payload);

    logger.info('Wallets found.', { wallets });

    return {
      ctx,
      value: wallets,
    };
  }
}
