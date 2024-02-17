import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  InAnalysisPixInfractionKafkaRequest,
} from '@zro/pix-payments/infrastructure';
import {
  InAnalysisPixInfractionRequest,
  InAnalysisPixInfractionResponse,
} from '@zro/pix-payments/interface';

/**
 * InAnalysis infraction microservice.
 */
@KafkaSubscribeService([KAFKA_TOPICS.PIX_INFRACTION.IN_ANALYSIS])
export class InAnalysisPixInfractionServiceKafka {
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
      context: InAnalysisPixInfractionServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to in analysis infraction.
   * @param payload Data.
   */
  async execute(
    payload: InAnalysisPixInfractionRequest,
  ): Promise<InAnalysisPixInfractionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: InAnalysisPixInfractionKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send in analysis infraction message.', { data });

    // Call pix-payments microservice.
    const result = await this.kafkaService.send<
      InAnalysisPixInfractionResponse,
      InAnalysisPixInfractionKafkaRequest
    >(KAFKA_TOPICS.PIX_INFRACTION.IN_ANALYSIS, data);

    logger.debug('Received in analysis infraction message.', { result });

    return result;
  }
}
