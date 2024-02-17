import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { BankingTedRepository } from '@zro/banking/domain';
import { UserService } from '@zro/banking/application';
import {
  GetBankingTedReceiptByUserAndOperationController,
  GetBankingTedReceiptByUserAndOperationRequest,
  GetBankingTedReceiptByUserAndOperationResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankingTedDatabaseRepository,
  UserServiceKafka,
} from '@zro/banking/infrastructure';

export type GetBankingTedReceiptByUserAndOperationKafkaRequest =
  KafkaMessage<GetBankingTedReceiptByUserAndOperationRequest>;

export type GetBankingTedReceiptByUserAndOperationKafkaResponse =
  KafkaResponse<GetBankingTedReceiptByUserAndOperationResponse>;

/**
 * BankingTed RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetBankingTedReceiptByUserAndOperationMicroserviceController {
  /**
   * Consumer of get bankingTed receipt.
   *
   * @param bankingTedRepository BankingTed repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.BANKING_TED.GET_RECEIPT_BY_USER_AND_OPERATION,
  )
  async execute(
    @RepositoryParam(BankingTedDatabaseRepository)
    bankingTedRepository: BankingTedRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @LoggerParam(GetBankingTedReceiptByUserAndOperationMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetBankingTedReceiptByUserAndOperationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetBankingTedReceiptByUserAndOperationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetBankingTedReceiptByUserAndOperationRequest(message);

    logger.info('Getting bankingTed receipt.', { payload });

    // Create and call get bankingTed receipt controller.
    const controller = new GetBankingTedReceiptByUserAndOperationController(
      logger,
      bankingTedRepository,
      userService,
    );

    // Get bankingTed
    const receipt = await controller.execute(payload);

    logger.info('BankingTed receipt.', { receipt });

    return {
      ctx,
      value: receipt,
    };
  }
}
