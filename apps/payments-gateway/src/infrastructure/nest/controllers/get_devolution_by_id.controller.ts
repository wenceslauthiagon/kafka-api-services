import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
} from '@zro/common';
import { PaymentsGatewayAxiosService } from '@zro/payments-gateway/infrastructure';
import { KAFKA_TOPICS } from '@zro/payments-gateway/infrastructure';
import {
  GetDevolutionByIdController,
  GetTransactionByIdRequest,
  TransactionResponseItem,
} from '@zro/payments-gateway/interface';

export type GetDevolutionByIdKafkaRequest =
  KafkaMessage<GetTransactionByIdRequest>;

export type GetDevolutionByIdKafkaResponse =
  KafkaResponse<TransactionResponseItem>;

/**
 * Get devolution by id controller.
 */
@Controller()
@MicroserviceController()
export class GetDevolutionByIdMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetDevolutionById.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.DEVOLUTION.GET_BY_ID)
  async execute(
    @LoggerParam(GetDevolutionByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetTransactionByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetDevolutionByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetTransactionByIdRequest(message);

    logger.info('Get devolution by id.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetDevolutionById controller.
    const controller = new GetDevolutionByIdController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Get devolution by id response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
