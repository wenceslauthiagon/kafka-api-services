import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  BankingAccountContactRepository,
  BankingContactRepository,
} from '@zro/banking/domain';
import {
  DeleteBankingAccountContactRequest,
  DeleteBankingAccountContactController,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankingContactDatabaseRepository,
  BankingAccountContactDatabaseRepository,
} from '@zro/banking/infrastructure';

export type DeleteBankingAccountContactKafkaRequest =
  KafkaMessage<DeleteBankingAccountContactRequest>;

/**
 * Delete banking contact controller.
 */
@Controller()
@MicroserviceController()
export class DeleteBankingAccountContactMicroserviceController {
  /**
   * Parse delete banking contact message and call delete banking contact controller.
   *
   * @param bankingContactRepository BankingContactRepository repository.
   * @param bankingAccountContactRepository BankingAccountContact repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANKING_CONTACT.DELETE_BY_ID_AND_USER)
  async execute(
    @RepositoryParam(BankingContactDatabaseRepository)
    bankingContactRepository: BankingContactRepository,
    @RepositoryParam(BankingAccountContactDatabaseRepository)
    bankingAccountContactRepository: BankingAccountContactRepository,
    @LoggerParam(DeleteBankingAccountContactMicroserviceController)
    logger: Logger,
    @Payload('value') message: DeleteBankingAccountContactRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new DeleteBankingAccountContactRequest(message);

    logger.info('Delete bank.', { payload });

    // Create delete banking contact controller.
    const controller = new DeleteBankingAccountContactController(
      logger,
      bankingContactRepository,
      bankingAccountContactRepository,
    );

    // Delete banking contact.
    const result = await controller.execute(payload);

    logger.info('BankingAccountContact deleted.', { result });
  }
}
