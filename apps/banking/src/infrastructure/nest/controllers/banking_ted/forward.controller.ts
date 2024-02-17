import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { BankingTedRepository } from '@zro/banking/domain';
import {
  KAFKA_TOPICS,
  BankingTedDatabaseRepository,
  BankingTedEventKafkaEmitter,
} from '@zro/banking/infrastructure';
import {
  ForwardBankingTedResponse,
  ForwardBankingTedController,
  ForwardBankingTedRequest,
  BankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

export type ForwardBankingTedKafkaRequest =
  KafkaMessage<ForwardBankingTedRequest>;

export type ForwardBankingTedKafkaResponse =
  KafkaResponse<ForwardBankingTedResponse>;

@Controller()
@MicroserviceController()
export class ForwardBankingTedMicroserviceController {
  /**
   * Consumer of foward bankingTed.
   * @param {BankingTedRepository} bankingTedRepository BankingTed repository.
   * @param {Logger} logger Request logger.
   * @param {ForwardBankingTedKafkaRequest} message Request Kafka message.
   * @returns {ForwardBankingTedKafkaResponse} Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANKING_TED.FORWARD)
  async execute(
    @RepositoryParam(BankingTedDatabaseRepository)
    bankingTedRepository: BankingTedRepository,
    @EventEmitterParam(BankingTedEventKafkaEmitter)
    bankingTedEmitter: BankingTedEventEmitterControllerInterface,
    @LoggerParam(ForwardBankingTedMicroserviceController)
    logger: Logger,
    @Payload('value') message: ForwardBankingTedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ForwardBankingTedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ForwardBankingTedRequest(message);

    // Forward and call bankingTed controller.
    const controller = new ForwardBankingTedController(
      logger,
      bankingTedRepository,
      bankingTedEmitter,
    );

    // Call bankingTed controller
    const bankingTed = await controller.execute(payload);

    // Forward bankingTed
    logger.info('BankingTed forwarded.', { bankingTed });

    return {
      ctx,
      value: bankingTed,
    };
  }
}
