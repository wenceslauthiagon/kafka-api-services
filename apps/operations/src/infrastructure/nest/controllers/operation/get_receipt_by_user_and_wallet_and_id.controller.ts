import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  OperationRepository,
  UserWalletRepository,
  WalletAccountCacheRepository,
  WalletRepository,
} from '@zro/operations/domain';
import {
  BankingService,
  OtcService,
  PixPaymentsService,
  UserService,
} from '@zro/operations/application';
import {
  GetOperationReceiptByUserAndWalletAndIdController,
  GetOperationReceiptByUserAndWalletAndIdRequest,
  GetOperationReceiptByUserAndWalletAndIdResponse,
} from '@zro/operations/interface';
import {
  BankingServiceKafka,
  KAFKA_TOPICS,
  OperationDatabaseRepository,
  OtcServiceKafka,
  PixPaymentsServiceKafka,
  UserServiceKafka,
  UserWalletDatabaseRepository,
  WalletAccountCacheDatabaseRepository,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetOperationReceiptByUserAndWalletAndIdKafkaRequest =
  KafkaMessage<GetOperationReceiptByUserAndWalletAndIdRequest>;

export type GetOperationReceiptByUserAndWalletAndIdKafkaResponse =
  KafkaResponse<GetOperationReceiptByUserAndWalletAndIdResponse>;

/**
 * Operation controller.
 */
@Controller()
@MicroserviceController()
export class GetOperationReceiptByUserAndWalletAndIdMicroserviceController {
  /**
   * Consumer of get operation receipt.
   *
   * @param operationRepository Operation repository.
   * @param walletRepository Wallet repository.
   * @param pixPaymentsService PixPayments service.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.OPERATION.GET_RECEIPT_BY_USER_AND_WALLET_AND_ID,
  )
  async execute(
    @RepositoryParam(OperationDatabaseRepository)
    operationRepository: OperationRepository,
    @RepositoryParam(WalletAccountCacheDatabaseRepository)
    walletAccountCacheRepository: WalletAccountCacheRepository,
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @KafkaServiceParam(PixPaymentsServiceKafka)
    pixPaymentsService: PixPaymentsService,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @KafkaServiceParam(BankingServiceKafka)
    bankingService: BankingService,
    @KafkaServiceParam(OtcServiceKafka)
    otcService: OtcService,
    @LoggerParam(GetOperationReceiptByUserAndWalletAndIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetOperationReceiptByUserAndWalletAndIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetOperationReceiptByUserAndWalletAndIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetOperationReceiptByUserAndWalletAndIdRequest(message);

    // Create and call get operations controller.
    const controller = new GetOperationReceiptByUserAndWalletAndIdController(
      logger,
      operationRepository,
      walletAccountCacheRepository,
      userWalletRepository,
      walletRepository,
      pixPaymentsService,
      userService,
      bankingService,
      otcService,
    );

    // Get all operations
    const receipt = await controller.execute(payload);

    logger.info('Operation receipt.', { receipt });

    return {
      ctx,
      value: receipt,
    };
  }
}
