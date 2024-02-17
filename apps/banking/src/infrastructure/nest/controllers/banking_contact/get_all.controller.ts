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
import { BankingContactRepository } from '@zro/banking/domain';
import {
  GetAllBankingContactController,
  GetAllBankingContactRequest,
  GetAllBankingContactResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankingContactDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetAllBankingContactKafkaRequest =
  KafkaMessage<GetAllBankingContactRequest>;

export type GetAllBankingContactKafkaResponse =
  KafkaResponse<GetAllBankingContactResponse>;

/**
 * BankingContact controller.
 */
@Controller()
@MicroserviceController()
export class GetAllBankingContactMicroserviceController {
  /**
   * Consumer of get bankingContacts.
   *
   * @param bankingContactRepository BankingContact repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANKING_CONTACT.GET_ALL)
  async execute(
    @RepositoryParam(BankingContactDatabaseRepository)
    bankingContactRepository: BankingContactRepository,
    @LoggerParam(GetAllBankingContactMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllBankingContactRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllBankingContactKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllBankingContactRequest(message);

    // Create and call get bankingContacts controller.
    const controller = new GetAllBankingContactController(
      logger,
      bankingContactRepository,
    );

    // Get bankingContacts
    const bankingContacts = await controller.execute(payload);

    logger.info('BankingContacts found.', { bankingContacts });

    return {
      ctx,
      value: bankingContacts,
    };
  }
}
