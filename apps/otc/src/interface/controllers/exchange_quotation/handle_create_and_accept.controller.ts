import { Logger } from 'winston';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  ExchangeQuotation,
  ExchangeQuotationRepository,
  ExchangeQuotationServerRepository,
  ExchangeQuotationState,
  Provider,
  ProviderEntity,
  Remittance,
  RemittanceExchangeQuotationRepository,
  RemittanceRepository,
  System,
  SystemEntity,
} from '@zro/otc/domain';
import {
  ExchangeQuotationGateway,
  HandleCreateAndAcceptExchangeQuotationEventUseCase,
  OperationService,
  QuotationService,
  UtilService,
} from '@zro/otc/application';

type THandleCreateAndAcceptExchangeQuotationEventRequest = Pick<
  Remittance,
  'sendDate' | 'receiveDate'
> & {
  remittanceIds: Remittance['id'][];
  currencyTag: Currency['tag'];
  providerId?: Provider['id'];
  systemId?: System['id'];
};

export class HandleCreateAndAcceptExchangeQuotationEventRequest
  extends AutoValidator
  implements THandleCreateAndAcceptExchangeQuotationEventRequest
{
  @IsArray()
  @IsUUID(4, { each: true })
  remittanceIds: Remittance['id'][];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format sendDate',
  })
  sendDate: Remittance['sendDate'];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format receiveDate',
  })
  receiveDate: Remittance['receiveDate'];

  @IsString()
  @MaxLength(255)
  currencyTag: Currency['tag'];

  @IsUUID(4)
  @IsOptional()
  providerId?: Provider['id'];

  @IsUUID(4)
  @IsOptional()
  systemId?: System['id'];

  constructor(props: THandleCreateAndAcceptExchangeQuotationEventRequest) {
    super(props);
  }
}

type THandleCreateAndAcceptExchangeQuotationEventResponse = Pick<
  ExchangeQuotation,
  'id' | 'quotationPspId' | 'quotation' | 'state' | 'createdAt'
>;

export class HandleCreateAndAcceptExchangeQuotationEventResponse
  extends AutoValidator
  implements THandleCreateAndAcceptExchangeQuotationEventResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  quotationPspId: string;

  @IsInt()
  @Min(0)
  quotation: number;

  @IsEnum(ExchangeQuotationState)
  state: ExchangeQuotationState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleCreateAndAcceptExchangeQuotationEventResponse) {
    super(props);
  }
}

export class HandleCreateAndAcceptExchangeQuotationEventController {
  private usecase: HandleCreateAndAcceptExchangeQuotationEventUseCase;

  constructor(
    private logger: Logger,
    pspGateway: ExchangeQuotationGateway,
    exchangeQuotationRepository: ExchangeQuotationRepository,
    exchangeQuotationServerRepository: ExchangeQuotationServerRepository,
    remittanceRepository: RemittanceRepository,
    remittanceExchangeQuotationRepository: RemittanceExchangeQuotationRepository,
    operationService: OperationService,
    utilService: UtilService,
    quotationService: QuotationService,
    zroBankPartnerId: number,
    operationCurrencySymbolUsd: string,
  ) {
    this.logger = logger.child({
      context: HandleCreateAndAcceptExchangeQuotationEventController.name,
    });

    this.usecase = new HandleCreateAndAcceptExchangeQuotationEventUseCase(
      logger,
      pspGateway,
      exchangeQuotationRepository,
      exchangeQuotationServerRepository,
      remittanceRepository,
      remittanceExchangeQuotationRepository,
      operationService,
      utilService,
      quotationService,
      zroBankPartnerId,
      operationCurrencySymbolUsd,
    );
  }

  async execute(
    request: HandleCreateAndAcceptExchangeQuotationEventRequest,
  ): Promise<HandleCreateAndAcceptExchangeQuotationEventResponse> {
    this.logger.debug(
      'Create and accept exchange quotation for remittance request.',
      { request },
    );

    const {
      remittanceIds,
      sendDate,
      receiveDate,
      currencyTag,
      providerId,
      systemId,
    } = request;

    const provider = providerId && new ProviderEntity({ id: providerId });
    const system = systemId && new SystemEntity({ id: systemId });

    const result = await this.usecase.execute(
      remittanceIds,
      sendDate,
      receiveDate,
      currencyTag,
      provider,
      system,
    );
    if (!result) return null;

    const response = new HandleCreateAndAcceptExchangeQuotationEventResponse({
      id: result.id,
      quotationPspId: result.quotationPspId,
      quotation: result.quotation,
      state: result.state,
      createdAt: result.createdAt,
    });

    return response;
  }
}
