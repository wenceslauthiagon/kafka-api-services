import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  CacheTTL,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { HolidayRepository } from '@zro/quotations/domain';
import {
  KAFKA_TOPICS,
  HolidayDatabaseRepository,
} from '@zro/quotations/infrastructure';
import {
  GetHolidayByDateResponse,
  GetHolidayByDateController,
  GetHolidayByDateRequest,
} from '@zro/quotations/interface';

export type GetHolidayByDateKafkaRequest =
  KafkaMessage<GetHolidayByDateRequest>;

export type GetHolidayByDateKafkaResponse =
  KafkaResponse<GetHolidayByDateResponse>;

@Controller()
@CacheTTL(86400) // 24h
@MicroserviceController()
export class GetHolidayByDateMicroserviceController {
  /**
   * Consumer of get holiday.
   * @param holidayRepository Holiday repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.HOLIDAY.GET_BY_DATE)
  async execute(
    @RepositoryParam(HolidayDatabaseRepository)
    holidayRepository: HolidayRepository,
    @LoggerParam(GetHolidayByDateMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetHolidayByDateRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetHolidayByDateKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetHolidayByDateRequest(message);

    // Create and call holiday controller.
    const controller = new GetHolidayByDateController(
      logger,
      holidayRepository,
    );

    // Call holiday controller
    const holiday = await controller.execute(payload);

    // Get holiday
    logger.info('Holiday found.', { holiday });

    return {
      ctx,
      value: holiday,
    };
  }
}
