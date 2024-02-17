import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  Pagination,
  PaginationEntity,
  PaginationRequest,
  AutoValidator,
  PaginationResponse,
  IsIsoStringDateFormat,
  Sort,
  PaginationSort,
  IsDateBeforeThan,
  IsDateAfterThan,
} from '@zro/common';
import {
  Conversion,
  ConversionRepository,
  TGetConversionFilter,
  OrderSide,
} from '@zro/otc/domain';
import { Quotation } from '@zro/quotations/domain';
import { User, UserEntity } from '@zro/users/domain';
import { Currency, Operation } from '@zro/operations/domain';
import {
  GetAllConversionUseCase as UseCase,
  OperationService,
  QuotationService,
} from '@zro/otc/application';

export enum GetAllConversionRequestSort {
  CREATED_AT = 'created_at',
}

type UserId = User['uuid'];

export type TGetAllConversionRequest = Pagination &
  TGetConversionFilter & { userId: UserId };

export class GetAllConversionRequest
  extends PaginationRequest
  implements TGetAllConversionRequest
{
  @IsOptional()
  @Sort(GetAllConversionRequestSort)
  sort?: PaginationSort;

  @IsUUID(4)
  userId: UserId;

  @IsOptional()
  @IsUUID(4)
  operationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  currencySymbol?: string;

  @IsOptional()
  @IsUUID(4)
  quotationId?: string;

  @IsOptional()
  @IsEnum(OrderSide)
  conversionType?: OrderSide;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientDocument?: string;

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

  constructor(props: TGetAllConversionRequest) {
    super(props);
  }
}

type OperationId = Operation['id'];
type QuotationId = Quotation['id'];
type CurrencyId = Currency['id'];

type TGetAllConversionResponseItem = Pick<
  Conversion,
  'id' | 'clientName' | 'clientDocument' | 'amount' | 'quote' | 'createdAt'
> & {
  operationId: OperationId;
  quotationId?: QuotationId;
  currencyId?: CurrencyId;
  side: Conversion['conversionType'];
  currencyTitle?: Currency['title'];
  currencySymbol?: Currency['symbol'];
  currencyDecimal?: Currency['decimal'];
  //  V2 fields
  priceBuy?: Quotation['priceBuy'];
  priceSell?: Quotation['priceSell'];
  quoteAmountBuy?: Quotation['quoteAmountBuy'];
  quoteAmountSell?: Quotation['quoteAmountSell'];
  quoteCurrencySymbol?: Currency['symbol'];
  quoteCurrencyDecimal?: Currency['decimal'];
  quoteCurrencyTitle?: Currency['title'];
  baseAmountBuy?: Quotation['baseAmountBuy'];
  baseAmountSell?: Quotation['baseAmountSell'];
  baseCurrencySymbol?: Currency['symbol'];
  baseCurrencyDecimal?: Currency['decimal'];
  baseCurrencyTitle?: Currency['title'];
};

export class GetAllConversionResponseItem
  extends AutoValidator
  implements TGetAllConversionResponseItem
{
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  operationId: OperationId;

  @IsOptional()
  @IsUUID(4)
  quotationId?: QuotationId;

  @IsOptional()
  @IsInt()
  currencyId?: CurrencyId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  currencyTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  currencySymbol?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  currencyDecimal?: number;

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientDocument?: string;

  @IsOptional()
  @IsInt()
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  quote?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt?: Date;

  // V2 fields
  @IsInt()
  @IsPositive()
  @IsOptional()
  priceBuy?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  priceSell?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  quoteAmountBuy?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  quoteAmountSell?: number;

  @IsString()
  @IsOptional()
  quoteCurrencySymbol?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  quoteCurrencyDecimal?: number;

  @IsString()
  @IsOptional()
  quoteCurrencyTitle?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  baseAmountBuy?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  baseAmountSell?: number;

  @IsString()
  @IsOptional()
  baseCurrencySymbol?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  baseCurrencyDecimal?: number;

  @IsString()
  @IsOptional()
  baseCurrencyTitle?: string;

  constructor(props: TGetAllConversionResponseItem) {
    super(props);
  }
}

export class GetAllConversionResponse extends PaginationResponse<GetAllConversionResponseItem> {}

export class GetAllConversionController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    conversionRepository: ConversionRepository,
    operationService: OperationService,
    quotationService: QuotationService,
  ) {
    this.logger = logger.child({ context: GetAllConversionController.name });
    this.usecase = new UseCase(
      this.logger,
      conversionRepository,
      operationService,
      quotationService,
    );
  }

  async execute(
    request: GetAllConversionRequest,
  ): Promise<GetAllConversionResponse> {
    this.logger.debug('Get all conversions request.', { request });

    const {
      order,
      page,
      pageSize,
      sort,
      userId,
      operationId,
      currencySymbol,
      quotationId,
      conversionType,
      clientName,
      clientDocument,
      createdAtStart,
      createdAtEnd,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const user = new UserEntity({ uuid: userId });
    const filter: TGetConversionFilter = {
      ...(operationId && { operationId }),
      ...(currencySymbol && { currencySymbol }),
      ...(quotationId && { quotationId }),
      ...(conversionType && { conversionType }),
      ...(clientName && { clientName }),
      ...(clientDocument && { clientDocument }),
      ...(createdAtStart && { createdAtStart }),
      ...(createdAtEnd && { createdAtEnd }),
    };

    const results = await this.usecase.execute(user, pagination, filter);

    const data = results.data.map(
      (conversion) =>
        new GetAllConversionResponseItem({
          id: conversion.id,
          operationId: conversion.operation?.id,
          quotationId: conversion.quotation?.id,
          currencyId: conversion.currency?.id,
          side: conversion.conversionType,
          currencyTitle: conversion.currency?.title,
          currencySymbol: conversion.currency?.symbol,
          currencyDecimal: conversion.currency?.decimal,
          clientName: conversion.clientName,
          clientDocument: conversion.clientDocument,
          amount: conversion.amount,
          quote: conversion.quote,
          createdAt: conversion.createdAt,

          // V2 fields
          priceBuy: conversion.quotation?.priceBuy,
          priceSell: conversion.quotation?.priceSell,
          quoteAmountBuy: conversion.quotation?.quoteAmountBuy,
          quoteAmountSell: conversion.quotation?.quoteAmountSell,
          quoteCurrencySymbol: conversion.quotation?.quoteCurrency?.symbol,
          quoteCurrencyDecimal: conversion.quotation?.quoteCurrency?.decimal,
          quoteCurrencyTitle: conversion.quotation?.quoteCurrency?.title,
          baseAmountBuy: conversion.quotation?.baseAmountBuy,
          baseAmountSell: conversion.quotation?.baseAmountSell,
          baseCurrencySymbol: conversion.quotation?.baseCurrency?.symbol,
          baseCurrencyDecimal: conversion.quotation?.baseCurrency?.decimal,
          baseCurrencyTitle: conversion.quotation?.baseCurrency?.title,
        }),
    );

    const response = new GetAllConversionResponse({ ...results, data });

    this.logger.info('Get all conversions response.', {
      conversions: response,
    });

    return response;
  }
}
