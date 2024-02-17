import { Logger } from 'winston';
import { SyncCreateRemittanceUseCase as UseCase } from '@zro/otc/application';
import {
  RemittanceOrderRepository,
  RemittanceOrderCurrentGroupRepository,
  RemittanceExposureRuleRepository,
  RemittanceRepository,
  SettlementDateCode,
  RemittanceOrderRemittanceRepository,
} from '@zro/otc/domain';
import {
  RemittanceOrderEventEmitterController,
  RemittanceOrderEventEmitterControllerInterface,
  RemittanceEventEmitterController,
  RemittanceEventEmitterControllerInterface,
} from '@zro/otc/interface';

export class SyncCreateRemittanceController {
  private readonly usecase: UseCase;

  constructor(
    private logger: Logger,
    remittanceOrderRepository: RemittanceOrderRepository,
    remittanceOrderCurrentGroupCacheRepository: RemittanceOrderCurrentGroupRepository,
    defaultSendDateCode: SettlementDateCode,
    defaultReceiveDateCode: SettlementDateCode,
    remittanceExposureRuleRepository: RemittanceExposureRuleRepository,
    remittanceRepository: RemittanceRepository,
    remittanceOrderServiceEventEmitter: RemittanceOrderEventEmitterControllerInterface,
    remittanceServiceEventEmitter: RemittanceEventEmitterControllerInterface,
    remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
  ) {
    this.logger = logger.child({
      context: SyncCreateRemittanceController.name,
    });

    const remittanceOrderEventEmitter =
      new RemittanceOrderEventEmitterController(
        remittanceOrderServiceEventEmitter,
      );

    const remittanceEventEmitter = new RemittanceEventEmitterController(
      remittanceServiceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      remittanceOrderRepository,
      remittanceOrderCurrentGroupCacheRepository,
      defaultSendDateCode,
      defaultReceiveDateCode,
      remittanceExposureRuleRepository,
      remittanceRepository,
      remittanceOrderEventEmitter,
      remittanceEventEmitter,
      remittanceOrderRemittanceRepository,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Started create remittance request.');

    await this.usecase.execute();

    this.logger.debug('Finished create remittance request.');
  }
}
