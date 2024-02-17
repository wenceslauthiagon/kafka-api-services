import { IsEnum, IsUUID } from 'class-validator';
import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import {
  BotOtc,
  BotOtcEntity,
  BotOtcOrderRepository,
  BotOtcRepository,
  BotOtcType,
} from '@zro/otc-bot/domain';
import { CryptoRemittanceGateway } from '@zro/otc/application';
import {
  OperationService,
  OtcService,
  QuotationService,
  RunSpreadBotUseCase,
} from '@zro/otc-bot/application';

type TRunBotOtcRequest = Pick<BotOtc, 'id' | 'type'>;

export class RunBotOtcRequest
  extends AutoValidator
  implements TRunBotOtcRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(BotOtcType)
  type: BotOtcType;
}

export class RunBotOtcController {
  constructor(
    private logger: Logger,
    private botOtcRepository: BotOtcRepository,
    private botOtcOrderRepository: BotOtcOrderRepository,
    private quotationService: QuotationService,
    private otcService: OtcService,
    private operationService: OperationService,
    private cryptoRemittanceGateways: CryptoRemittanceGateway[],
  ) {
    this.logger = logger.child({ context: RunBotOtcController.name });
  }

  async execute(request: RunBotOtcRequest): Promise<void> {
    const { id, type } = request;

    const bot = new BotOtcEntity({ id });

    const typeMapper = {
      [BotOtcType.SPREAD]: this.executeSpread.bind(this),
    };

    return typeMapper[type](bot);
  }

  private async executeSpread(bot: BotOtc): Promise<void> {
    const usecase = new RunSpreadBotUseCase(
      this.logger,
      this.botOtcRepository,
      this.botOtcOrderRepository,
      this.quotationService,
      this.otcService,
      this.operationService,
      this.cryptoRemittanceGateways,
    );

    return usecase.execute(bot);
  }
}
