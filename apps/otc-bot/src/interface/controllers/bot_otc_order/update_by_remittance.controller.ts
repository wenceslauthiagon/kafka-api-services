import { Logger } from 'winston';
import {
  OtcService,
  UpdateBotOtcOrderByRemittanceUseCase as UseCase,
} from '@zro/otc-bot/application';
import { BotOtcOrderRepository } from '@zro/otc-bot/domain';
import {
  BotOtcOrderEventEmitterController,
  BotOtcOrderEventEmitterControllerInterface,
} from '@zro/otc-bot/interface';
import {
  CryptoOrder,
  CryptoOrderEntity,
  Remittance,
  RemittanceEntity,
} from '@zro/otc/domain';
import { IsInt, IsPositive, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';

type TUpdateBotOtcOrderByRemittanceRequest = {
  remittanceBankQuote: Remittance['bankQuote'];
  remittanceId: Remittance['id'];
  cryptoOrderId: CryptoOrder['id'];
};

export class UpdateBotOtcOrderByRemittanceRequest
  extends AutoValidator
  implements TUpdateBotOtcOrderByRemittanceRequest
{
  @IsUUID(4)
  remittanceId: Remittance['id'];

  @IsInt()
  @IsPositive()
  remittanceBankQuote: Remittance['bankQuote'];

  @IsUUID(4)
  cryptoOrderId: CryptoOrder['id'];

  constructor(props: TUpdateBotOtcOrderByRemittanceRequest) {
    super(props);
  }
}

export class UpdateBotOtcOrderByRemittanceController {
  private readonly usecase: UseCase;

  constructor(
    private logger: Logger,
    botOtcOrderRepository: BotOtcOrderRepository,
    botOtcOrderEventEmitter: BotOtcOrderEventEmitterControllerInterface,
    otcService: OtcService,
  ) {
    this.logger = logger.child({
      context: UpdateBotOtcOrderByRemittanceController.name,
    });

    const eventEmitter = new BotOtcOrderEventEmitterController(
      botOtcOrderEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      botOtcOrderRepository,
      eventEmitter,
      otcService,
    );
  }

  async execute(request: UpdateBotOtcOrderByRemittanceRequest): Promise<void> {
    this.logger.debug('Update bot otc order by remittance request.', {
      request,
    });

    const { remittanceId, remittanceBankQuote, cryptoOrderId } = request;

    const buyRemittance = new RemittanceEntity({
      id: remittanceId,
      bankQuote: remittanceBankQuote,
    });
    const buyCryptoOrder = new CryptoOrderEntity({ id: cryptoOrderId });

    await this.usecase.execute(buyCryptoOrder, buyRemittance);

    this.logger.debug('Update bot otc order by remittance finished.');
  }
}
