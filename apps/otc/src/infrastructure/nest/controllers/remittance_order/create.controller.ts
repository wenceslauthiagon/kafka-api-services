import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  ProviderRepository,
  RemittanceOrderRepository,
  SystemRepository,
} from '@zro/otc/domain';
import {
  KAFKA_TOPICS,
  RemittanceOrderDatabaseRepository,
  RemittanceOrderEventKafkaEmitter,
  SystemDatabaseRepository,
  ProviderDatabaseRepository,
  OperationServiceKafka,
} from '@zro/otc/infrastructure';
import {
  CreateRemittanceOrderResponse,
  CreateRemittanceOrderController,
  CreateRemittanceOrderRequest,
  RemittanceOrderEventEmitterControllerInterface,
} from '@zro/otc/interface';

export type CreateRemittanceOrderKafkaRequest =
  KafkaMessage<CreateRemittanceOrderRequest>;

export type CreateRemittanceOrderKafkaResponse =
  KafkaResponse<CreateRemittanceOrderResponse>;

@Controller()
@MicroserviceController()
export class CreateRemittanceOrderMicroserviceController {
  /**
   * Consumer of create remittance order.
   * @param remittanceOrderRepository Remittance order repository.
   * @param operationService Operation service.
   * @param systemRepository System repository.
   * @param providerRepository Provider repository.
   * @param remittanceOrderEmitter Remittance order emitter.
   * @param logger Request logger.
   * @param message Request message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REMITTANCE_ORDER.CREATE)
  async execute(
    @RepositoryParam(RemittanceOrderDatabaseRepository)
    remittanceOrderRepository: RemittanceOrderRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @RepositoryParam(SystemDatabaseRepository)
    systemRepository: SystemRepository,
    @RepositoryParam(ProviderDatabaseRepository)
    providerRepository: ProviderRepository,
    @EventEmitterParam(RemittanceOrderEventKafkaEmitter)
    remittanceOrderEmitter: RemittanceOrderEventEmitterControllerInterface,
    @LoggerParam(CreateRemittanceOrderMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateRemittanceOrderRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateRemittanceOrderKafkaResponse> {
    logger.debug('Received message.', { value: message });
    // Parse kafka message.
    const payload = new CreateRemittanceOrderRequest(message);

    // Instantiate create remittance order controller.
    const controller = new CreateRemittanceOrderController(
      logger,
      remittanceOrderRepository,
      systemRepository,
      providerRepository,
      operationService,
      remittanceOrderEmitter,
    );

    // Call create remittance order controller
    const remittanceOrder = await controller.execute(payload);

    // Create remittance order
    logger.info('Remittance order created.', { remittanceOrder });

    return {
      ctx,
      value: remittanceOrder,
    };
  }
}
