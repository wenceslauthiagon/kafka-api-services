import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
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
} from '@zro/otc/infrastructure';
import {
  GetAllRemittanceExposureRuleResponse,
  GetAllRemittanceExposureRuleController,
  GetAllRemittanceExposureRuleRequest,
} from '@zro/otc/interface';

export type GetAllRemittanceExposureRuleKafkaRequest =
  KafkaMessage<GetAllRemittanceExposureRuleRequest>;

export type GetAllRemittanceExposureRuleKafkaResponse =
  KafkaResponse<GetAllRemittanceExposureRuleResponse>;

@Controller()
@MicroserviceController()
export class GetAllRemittanceExposureRuleMicroserviceController {
  /**
   * Consumer of get all remittance exposure rule.
   * @param remittanceExposureRuleRepository Remittance exposure rule repository.
   * @param operationService Operation service.
   * @param remittanceExposureRuleEmitter Remittance exposure rule emitter.
   * @param logger Request logger.
   * @param message Request message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REMITTANCE_EXPOSURE_RULE.GET_ALL)
  async execute(
    @RepositoryParam(RemittanceExposureRuleDatabaseRepository)
    remittanceExposureRuleRepository: RemittanceExposureRuleRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(GetAllRemittanceExposureRuleMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllRemittanceExposureRuleRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllRemittanceExposureRuleKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllRemittanceExposureRuleRequest(message);

    // Instantiate get all remittance exposure rule controller.
    const controller = new GetAllRemittanceExposureRuleController(
      logger,
      remittanceExposureRuleRepository,
      operationService,
    );

    // Call get all remittance exposure rule controller
    const rules = await controller.execute(payload);

    // get all remittance exposure rule
    logger.info('Remittance exposure rules found.', { rules });

    return {
      ctx,
      value: rules,
    };
  }
}
