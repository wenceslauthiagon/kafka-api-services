import { IsUUID } from 'class-validator';
import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import {
  BotOtcOrder,
  BotOtcOrderEntity,
  BotOtcOrderRepository,
  BotOtcRepository,
} from '@zro/otc-bot/domain';
import { CryptoRemittanceGateway } from '@zro/otc/application';
import { HandlePendingBotOtcOrderUseCase } from '@zro/otc-bot/application';
import {
  BotOtcOrderEventEmitterController,
  BotOtcOrderEventEmitterControllerInterface,
} from '@zro/otc-bot/interface';

type THandlePendingBotOtcOrderRequest = Pick<BotOtcOrder, 'id'>;

export class HandlePendingBotOtcOrderRequest
  extends AutoValidator
  implements THandlePendingBotOtcOrderRequest
{
  @IsUUID(4)
  id: string;
}

export class HandlePendingBotOtcOrderController {
  private usecase: HandlePendingBotOtcOrderUseCase;

  constructor(
    private logger: Logger,
    botOtcRepository: BotOtcRepository,
    botOtcOrderRepository: BotOtcOrderRepository,
    botOtcOrderEventEmitter: BotOtcOrderEventEmitterControllerInterface,
    cryptoRemittanceGateways: CryptoRemittanceGateway[],
  ) {
    this.logger = logger.child({
      context: HandlePendingBotOtcOrderController.name,
    });

    const eventEmitter = new BotOtcOrderEventEmitterController(
      botOtcOrderEventEmitter,
    );

    this.usecase = new HandlePendingBotOtcOrderUseCase(
      this.logger,
      botOtcRepository,
      botOtcOrderRepository,
      eventEmitter,
      cryptoRemittanceGateways,
    );
  }

  async execute(request: HandlePendingBotOtcOrderRequest): Promise<void> {
    this.logger.debug('Handle pending bot otc order started.');

    const { id } = request;

    const botOrder = new BotOtcOrderEntity({ id });

    await this.usecase.execute(botOrder);

    this.logger.debug('Handle pending bot otc order finished.');
  }
}
