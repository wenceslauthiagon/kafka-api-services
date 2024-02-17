import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Logger } from 'winston';
import {
  AutoValidator,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  getMoment,
} from '@zro/common';
import {
  BotOtc,
  BotOtcAnalysis,
  BotOtcOrderRepository,
  BotOtcRepository,
} from '@zro/otc-bot/domain';
import {
  GetBotOtcAnalysisUseCase as UseCase,
  OperationService,
  QuotationService,
} from '@zro/otc-bot/application';

type TGetBotOtcAnalysisRequest = Pick<BotOtc, 'id'> & {
  createdAtStart?: Date;
  createdAtEnd?: Date;
};

export class GetBotOtcAnalysisRequest
  extends AutoValidator
  implements TGetBotOtcAnalysisRequest
{
  @IsUUID(4)
  id: BotOtc['id'];

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('createdAtEnd', false, {
    message: 'createdAtStart must be before than createdAtEnd',
  })
  createdAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('createdAtStart', false, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  createdAtEnd?: Date;

  constructor(props: TGetBotOtcAnalysisRequest) {
    super(props);
  }
}

type TGetBotOtcAnalysisResponse = Pick<
  BotOtcAnalysis,
  | 'profit'
  | 'profitMargin'
  | 'volume'
  | 'quoteCurrencyTag'
  | 'quoteCurrencyDecimal'
> & {
  botOtcId: BotOtc['id'];
};

export class GetBotOtcAnalysisResponse
  extends AutoValidator
  implements TGetBotOtcAnalysisResponse
{
  @IsUUID(4)
  botOtcId: BotOtc['id'];

  @IsInt()
  profit: number;

  @IsInt()
  profitMargin: number;

  @IsInt()
  volume: number;

  @IsString()
  @MaxLength(255)
  quoteCurrencyTag: string;

  @IsInt()
  @Min(0)
  quoteCurrencyDecimal: number;

  constructor(props: TGetBotOtcAnalysisResponse) {
    super(props);
  }
}

export class GetBotOtcAnalysisController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    botOtcRepository: BotOtcRepository,
    botOtcOrderRepository: BotOtcOrderRepository,
    operationService: OperationService,
    quotationService: QuotationService,
    remittanceCurrencyTag: string,
    remittanceCurrencyDecimals: number,
    iofName: string,
  ) {
    this.logger = logger.child({
      context: GetBotOtcAnalysisController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      botOtcRepository,
      botOtcOrderRepository,
      operationService,
      quotationService,
      remittanceCurrencyTag,
      remittanceCurrencyDecimals,
      iofName,
    );
  }

  async execute(
    request: GetBotOtcAnalysisRequest,
  ): Promise<GetBotOtcAnalysisResponse> {
    this.logger.debug('Get bot otc analysis request.', {
      request,
    });

    const { id } = request;

    const createdAtStart =
      request.createdAtStart ?? getMoment().startOf('day').toDate();
    const createdAtEnd =
      request.createdAtEnd ?? getMoment().endOf('day').toDate();

    const response = await this.usecase.execute(
      id,
      createdAtStart,
      createdAtEnd,
    );

    const result =
      response &&
      new GetBotOtcAnalysisResponse({
        botOtcId: response.botOtc.id,
        profit: response.profit,
        profitMargin: response.profitMargin,
        volume: response.volume,
        quoteCurrencyTag: response.quoteCurrencyTag,
        quoteCurrencyDecimal: response.quoteCurrencyDecimal,
      });

    this.logger.debug('Get bot otc analysis response.', {
      botOtcAnalysis: result,
    });

    return result;
  }
}
