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
  KAFKA_TOPICS,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  GetWalletByUserAndDefaultIsTrueController,
  GetWalletByUserAndDefaultIsTrueRequest,
  GetWalletByUserAndDefaultIsTrueResponse,
} from '@zro/operations/interface';

export type GetWalletByUserAndDefaultIsTrueKafkaRequest =
  KafkaMessage<GetWalletByUserAndDefaultIsTrueRequest>;

export type GetWalletByUserAndDefaultIsTrueKafkaResponse =
  KafkaResponse<GetWalletByUserAndDefaultIsTrueResponse>;

@Controller()
@CacheTTL()
@MicroserviceController()
export class GetWalletByUserAndDefaultIsTrueMicroserviceController {
  /**
   * Parse get wallet by user and default is true message and call
   * get wallet by user and default is true controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET.GET_BY_USER_AND_DEFAULT_IS_TRUE)
  async execute(
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @LoggerParam(GetWalletByUserAndDefaultIsTrueMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetWalletByUserAndDefaultIsTrueRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetWalletByUserAndDefaultIsTrueKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetWalletByUserAndDefaultIsTrueRequest(message);

    logger.info('Get wallet by user and default is true.', { payload });

    // Create get controller.
    const controller = new GetWalletByUserAndDefaultIsTrueController(
      logger,
      walletRepository,
    );

    // Get wallet.
    const wallet = await controller.execute(payload);

    logger.info('Wallet found.', { wallet });

    return {
      ctx,
      value: wallet,
    };
  }
}
