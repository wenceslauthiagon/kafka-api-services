import { Logger } from 'winston';
import {
  BotOtc,
  BotOtcControl,
  BotOtcEntity,
  BotOtcRepository,
} from '@zro/otc-bot/domain';
import { AutoValidator } from '@zro/common';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { UpdateBotOtcUseCase } from '@zro/otc-bot/application';

type TUpdateBotOtcRequest = Pick<BotOtc, 'id'> &
  Partial<Pick<BotOtc, 'spread' | 'balance' | 'step' | 'control'>>;

export class UpdateBotOtcRequest
  extends AutoValidator
  implements TUpdateBotOtcRequest
{
  @IsUUID()
  id: string;

  @IsOptional()
  @IsPositive()
  @IsInt()
  spread?: number;

  @IsOptional()
  @IsPositive()
  @IsInt()
  balance?: number;

  @IsOptional()
  @IsPositive()
  @IsInt()
  step?: number;

  @IsOptional()
  @IsEnum(BotOtcControl)
  @IsIn([BotOtcControl.START, BotOtcControl.STOP])
  control?: BotOtcControl;

  constructor(props: TUpdateBotOtcRequest) {
    super(props);
  }
}

type TUpdateBotOtcResponse = Pick<
  BotOtc,
  'id' | 'name' | 'spread' | 'balance' | 'step' | 'control'
>;

export class UpdateBotOtcResponse
  extends AutoValidator
  implements TUpdateBotOtcResponse
{
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsPositive()
  @IsInt()
  spread: number;

  @IsOptional()
  @IsPositive()
  @IsInt()
  balance: number;

  @IsOptional()
  @IsPositive()
  @IsInt()
  step: number;

  @IsOptional()
  @IsEnum(BotOtcControl)
  control: BotOtcControl;

  constructor(props: TUpdateBotOtcResponse) {
    super(props);
  }
}

export class UpdateBotOtcController {
  private usecase: UpdateBotOtcUseCase;

  constructor(
    private logger: Logger,
    private readonly botOtcRepository: BotOtcRepository,
  ) {
    this.logger = logger.child({
      context: UpdateBotOtcController.name,
    });
    this.usecase = new UpdateBotOtcUseCase(this.logger, this.botOtcRepository);
  }

  async execute(request: UpdateBotOtcRequest): Promise<UpdateBotOtcResponse> {
    this.logger.debug('Update botOtc request.', { request });

    const { id, balance, spread, step, control } = request;

    const botOtc = new BotOtcEntity({ id, balance, spread, step, control });

    const updatedBotOtc = await this.usecase.execute(botOtc);

    if (!updatedBotOtc) return null;

    const response = new UpdateBotOtcResponse({
      id: updatedBotOtc.id,
      name: updatedBotOtc.name,
      spread: updatedBotOtc.spread,
      balance: updatedBotOtc.balance,
      step: updatedBotOtc.step,
      control: updatedBotOtc.control,
    });

    this.logger.info('Update botOtc response.', {
      botOtc: response,
    });

    return response;
  }
}
