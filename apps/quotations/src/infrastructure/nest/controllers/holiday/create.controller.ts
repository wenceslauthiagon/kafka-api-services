import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaMessagePattern,
} from '@zro/common';
import { HolidayRepository } from '@zro/quotations/domain';
import {
  KAFKA_TOPICS,
  HolidayDatabaseRepository,
} from '@zro/quotations/infrastructure';
import {
  CreateHolidayController,
  CreateHolidayRequest,
  CreateHolidayResponse,
} from '@zro/quotations/interface';

export type CreateHolidayKafkaRequest = KafkaMessage<CreateHolidayRequest>;

export type CreateHolidayKafkaResponse = KafkaResponse<CreateHolidayResponse>;

/**
 * Create holiday controller.
 */
@Controller()
@MicroserviceController()
export class CreateHolidayMicroserviceController {
  /**
   * @param holidayRepository Holiday repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.HOLIDAY.CREATE)
  async execute(
    @RepositoryParam(HolidayDatabaseRepository)
    holidayRepository: HolidayRepository,
    @LoggerParam(CreateHolidayMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateHolidayRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateHolidayKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateHolidayRequest(message);

    logger.info('Create holiday payload.', { payload });

    // Create holiday controller.
    const controller = new CreateHolidayController(logger, holidayRepository);

    const result = await controller.execute(payload);

    logger.info('Created holiday.', { result });

    return {
      ctx,
      value: result,
    };
  }
}
