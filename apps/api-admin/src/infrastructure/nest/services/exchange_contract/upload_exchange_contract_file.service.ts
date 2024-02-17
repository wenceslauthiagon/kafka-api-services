import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  UploadExchangeContractFileKafkaRequest,
} from '@zro/otc/infrastructure';
import {
  UploadExchangeContractFileRequest,
  UploadExchangeContractFileResponse,
} from '@zro/otc/interface';

/**
 * Upload file at Exchange Contract.
 */
const SERVICE = KAFKA_TOPICS.EXCHANGE_CONTRACT.UPLOAD_FILE;

@KafkaSubscribeService(SERVICE)
export class UploadExchangeContractFileServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: UploadExchangeContractFileServiceKafka.name,
    });
  }

  /**
   * Call systems microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: UploadExchangeContractFileRequest,
  ): Promise<UploadExchangeContractFileResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: UploadExchangeContractFileKafkaRequest = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send uploaded file for exchange contract message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      UploadExchangeContractFileResponse,
      UploadExchangeContractFileKafkaRequest
    >(SERVICE, data);

    logger.debug(
      'Received uploaded file for exchange contract message.',
      result,
    );

    return result;
  }
}
