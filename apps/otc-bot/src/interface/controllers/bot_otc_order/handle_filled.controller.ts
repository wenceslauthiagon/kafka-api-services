import { Logger } from 'winston';
import {
  OtcService,
  HandleFilledBotOtcOrderUseCase as UseCase,
} from '@zro/otc-bot/application';
import { BotOtcOrderRepository } from '@zro/otc-bot/domain';
import {
  BotOtcOrderEventEmitterController,
  BotOtcOrderEventEmitterControllerInterface,
} from '@zro/otc-bot/interface';

export class HandleFilledBotOtcOrderController {
  private readonly usecase: UseCase;

  constructor(
    private logger: Logger,
    botOtcOrderRepository: BotOtcOrderRepository,
    otcService: OtcService,
    botOtcOrderEventEmitter: BotOtcOrderEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleFilledBotOtcOrderController.name,
    });

    const eventEmitter = new BotOtcOrderEventEmitterController(
      botOtcOrderEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      botOtcOrderRepository,
      otcService,
      eventEmitter,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Handle filled bot otc order started.');

    await this.usecase.execute();

    this.logger.debug('Handle filled bot otc order finished.');
  }
}
