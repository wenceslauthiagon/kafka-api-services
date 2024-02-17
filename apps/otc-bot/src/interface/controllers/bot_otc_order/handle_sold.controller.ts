import { IsEnum, IsUUID } from 'class-validator';
import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import {
  BotOtcOrderEntity,
  BotOtcOrderRepository,
  BotOtcOrderState,
} from '@zro/otc-bot/domain';
import {
  BotOtcOrderEvent,
  HandleSoldBotOtcOrderUseCase,
  OtcService,
} from '@zro/otc-bot/application';
import {
  BotOtcOrderEventEmitterController,
  BotOtcOrderEventEmitterControllerInterface,
} from '@zro/otc-bot/interface';
import { System } from '@zro/otc/domain';

type THandleSoldBotOtcOrderEventRequest = Pick<
  BotOtcOrderEvent,
  'id' | 'state'
>;

export class HandleSoldBotOtcOrderEventRequest
  extends AutoValidator
  implements THandleSoldBotOtcOrderEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(BotOtcOrderState)
  state: BotOtcOrderState;
}

export class HandleSoldBotOtcOrderEventController {
  private usecase: HandleSoldBotOtcOrderUseCase;

  constructor(
    logger: Logger,
    botOtcOrderRepository: BotOtcOrderRepository,
    botOtcOrderEventEmitter: BotOtcOrderEventEmitterControllerInterface,
    otcService: OtcService,
    system: System,
  ) {
    logger = logger.child({
      context: HandleSoldBotOtcOrderEventController.name,
    });

    const eventEmitter = new BotOtcOrderEventEmitterController(
      botOtcOrderEventEmitter,
    );

    this.usecase = new HandleSoldBotOtcOrderUseCase(
      logger,
      botOtcOrderRepository,
      eventEmitter,
      otcService,
      system,
    );
  }

  async execute(request: HandleSoldBotOtcOrderEventRequest): Promise<void> {
    const { id } = request;

    const botOrder = new BotOtcOrderEntity({ id });

    return this.usecase.execute(botOrder);
  }
}
