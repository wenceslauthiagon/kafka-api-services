import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import { KAFKA_TOPICS } from '@zro/pix-payments/infrastructure';
import {
  GetPixInfractionByPspIdRequest,
  GetPixInfractionByPspIdResponse,
} from '@zro/pix-payments/interface';
import { GetPixInfractionByPspIdKafkaRequest } from '@zro/pix-payments/infrastructure';

/**
 * Get by infraction ID microservice.
 */
@KafkaSubscribeService([KAFKA_TOPICS.PIX_INFRACTION.GET_BY_PSP_ID])
export class GetPixInfractionByPspIdServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetPixInfractionByPspIdServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to get infraction.
   * @param payload Data.
   */
  async execute(
    payload: GetPixInfractionByPspIdRequest,
  ): Promise<GetPixInfractionByPspIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPixInfractionByPspIdKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send receive infraction message.', { data });

    // Call pix-payments microservice.
    const result = await this.kafkaService.send<
      GetPixInfractionByPspIdResponse,
      GetPixInfractionByPspIdKafkaRequest
    >(KAFKA_TOPICS.PIX_INFRACTION.GET_BY_PSP_ID, data);

    logger.debug('Received receive infraction message.', { result });

    return result;
  }
}
