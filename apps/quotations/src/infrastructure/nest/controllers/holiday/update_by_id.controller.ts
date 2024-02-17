import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
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
  UpdateHolidayByIdResponse,
  UpdateHolidayByIdController,
  UpdateHolidayByIdRequest,
} from '@zro/quotations/interface';

export type UpdateHolidayByIdKafkaRequest =
  KafkaMessage<UpdateHolidayByIdRequest>;

export type UpdateHolidayByIdKafkaResponse =
  KafkaResponse<UpdateHolidayByIdResponse>;

@Controller()
@MicroserviceController()
export class UpdateHolidayByIdMicroserviceController {
  /**
   * Consumer of update holiday.
   * @param holidayRepository Holiday repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.HOLIDAY.UPDATE_BY_ID)
  async execute(
    @RepositoryParam(HolidayDatabaseRepository)
    holidayRepository: HolidayRepository,
    @LoggerParam(UpdateHolidayByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateHolidayByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateHolidayByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateHolidayByIdRequest(message);

    // Create and call holiday controller.
    const controller = new UpdateHolidayByIdController(
      logger,
      holidayRepository,
    );

    // Call holiday controller
    const holiday = await controller.execute(payload);

    // Get holiday
    logger.info('Holiday updated.', { holiday });

    return {
      ctx,
      value: holiday,
    };
  }
}
