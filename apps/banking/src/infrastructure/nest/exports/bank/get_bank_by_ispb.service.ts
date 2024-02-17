import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetBankByIspbKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetBankByIspbRequest,
  GetBankByIspbResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANK.GET_BY_ISPB;

/**
 * Get bank by ispb microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetBankByIspbServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: GetBankByIspbServiceKafka.name });
  }

  /**
   * Call banks microservice to get a bank.
   * @param payload Data.
   */
  async execute(payload: GetBankByIspbRequest): Promise<GetBankByIspbResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetBankByIspbKafkaRequest = {
      key: `${payload.ispb}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send bank message.', { data });

    // Call create bank microservice.
    const result = await this.kafkaService.send<
      GetBankByIspbResponse,
      GetBankByIspbKafkaRequest
    >(SERVICE, data);

    logger.debug('Received bank message.', { result });

    return result;
  }
}
