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
  UpdateRemittanceExposureRuleResponse,
  UpdateRemittanceExposureRuleController,
  UpdateRemittanceExposureRuleRequest,
  RemittanceExposureRuleEventEmitterControllerInterface,
} from '@zro/otc/interface';

export type UpdateRemittanceExposureRuleKafkaRequest =
  KafkaMessage<UpdateRemittanceExposureRuleRequest>;

export type UpdateRemittanceExposureRuleKafkaResponse =
  KafkaResponse<UpdateRemittanceExposureRuleResponse>;

@Controller()
@MicroserviceController()
export class UpdateRemittanceExposureRuleMicroserviceController {
  /**
   * Consumer of update remittance exposure rule.
   * @param remittanceExposureRuleRepository Remittance exposure rule repository.
   * @param operationService Operation service.
   * @param remittanceExposureRuleEmitter Remittance exposure rule emitter.
   * @param logger Request logger.
   * @param message Request message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REMITTANCE_EXPOSURE_RULE.UPDATE)
  async execute(
    @RepositoryParam(RemittanceExposureRuleDatabaseRepository)
    remittanceExposureRuleRepository: RemittanceExposureRuleRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @EventEmitterParam(RemittanceExposureRuleEventKafkaEmitter)
    remittanceExposureRuleEmitter: RemittanceExposureRuleEventEmitterControllerInterface,
    @LoggerParam(UpdateRemittanceExposureRuleMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateRemittanceExposureRuleRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateRemittanceExposureRuleKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateRemittanceExposureRuleRequest(message);

    // Instantiate update remittance exposure rule controller.
    const controller = new UpdateRemittanceExposureRuleController(
      logger,
      remittanceExposureRuleRepository,
      operationService,
      remittanceExposureRuleEmitter,
    );

    // Call update remittance exposure rule controller
    const rule = await controller.execute(payload);

    // update remittance exposure rule
    logger.info('Remittance exposure rule updated.', { rule });

    return {
      ctx,
      value: rule,
    };
  }
}
