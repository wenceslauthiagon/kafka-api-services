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
import { RemittanceExposureRuleRepository } from '@zro/otc/domain';
import {
  KAFKA_TOPICS,
  RemittanceExposureRuleDatabaseRepository,
  OperationServiceKafka,
  RemittanceExposureRuleEventKafkaEmitter,
} from '@zro/otc/infrastructure';
import {
  CreateRemittanceExposureRuleResponse,
  CreateRemittanceExposureRuleController,
  CreateRemittanceExposureRuleRequest,
  RemittanceExposureRuleEventEmitterControllerInterface,
} from '@zro/otc/interface';

export type CreateRemittanceExposureRuleKafkaRequest =
  KafkaMessage<CreateRemittanceExposureRuleRequest>;

export type CreateRemittanceExposureRuleKafkaResponse =
  KafkaResponse<CreateRemittanceExposureRuleResponse>;

@Controller()
@MicroserviceController()
export class CreateRemittanceExposureRuleMicroserviceController {
  /**
   * Consumer of update remittance exposure rule.
   * @param remittanceExposureRuleRepository Remittance exposure rule repository.
   * @param operationService Operation service.
   * @param remittanceExposureRuleEmitter Remittance exposure rule emitter.
   * @param logger Request logger.
   * @param message Request message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REMITTANCE_EXPOSURE_RULE.CREATE)
  async execute(
    @RepositoryParam(RemittanceExposureRuleDatabaseRepository)
    remittanceExposureRuleRepository: RemittanceExposureRuleRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @EventEmitterParam(RemittanceExposureRuleEventKafkaEmitter)
    remittanceExposureRuleEmitter: RemittanceExposureRuleEventEmitterControllerInterface,
    @LoggerParam(CreateRemittanceExposureRuleMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateRemittanceExposureRuleRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateRemittanceExposureRuleKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateRemittanceExposureRuleRequest(message);

    // Instantiate create remittance exposure rule controller.
    const controller = new CreateRemittanceExposureRuleController(
      logger,
      remittanceExposureRuleRepository,
      operationService,
      remittanceExposureRuleEmitter,
    );

    // Call create remittance exposure rule controller
    const rule = await controller.execute(payload);

    // Create remittance exposure rule
    logger.info('Remittance exposure rule created.', { rule });

    return {
      ctx,
      value: rule,
    };
  }
}
