import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Quotation } from '@zro/quotations/domain';
import { Currency, Operation } from '@zro/operations/domain';
import { Conversion, ConversionRepository, OrderSide } from '@zro/otc/domain';
import {
  GetConversionByUserAndIdUseCase as UseCase,
  OperationService,
  QuotationService,
} from '@zro/otc/application';

type UserId = User['uuid'];

export type TGetConversionByUserAndIdRequest = Pick<Conversion, 'id'> & {
  userId: UserId;
};

export class GetConversionByUserAndIdRequest
  extends AutoValidator
  implements TGetConversionByUserAndIdRequest
{
  @IsUUID(4)
  id: Conversion['id'];

  @IsUUID(4)
  userId: UserId;

  constructor(props: TGetConversionByUserAndIdRequest) {
    super(props);
  }
}

type OperationId = Operation['id'];
type QuotationId = Quotation['id'];
type CurrencyId = Currency['id'];

type TGetConversionByUserAndIdResponse = Pick<
  Conversion,
  'id' | 'createdAt'
> & {
  operationId: OperationId;
  quotationId?: QuotationId;
  currencyId?: CurrencyId;
  side: Conversion['conversionType'];
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

export class GetConversionByUserAndIdResponse
  extends AutoValidator
  implements TGetConversionByUserAndIdResponse
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

  @IsEnum(OrderSide)
  side: OrderSide;

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

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt?: Date;

  constructor(props: TGetConversionByUserAndIdResponse) {
    super(props);
  }
}

export class GetConversionByUserAndIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    conversionRepository: ConversionRepository,
    operationService: OperationService,
    quotationService: QuotationService,
  ) {
    this.logger = logger.child({
      context: GetConversionByUserAndIdController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      conversionRepository,
      operationService,
      quotationService,
    );
  }

  async execute(
    request: GetConversionByUserAndIdRequest,
  ): Promise<GetConversionByUserAndIdResponse> {
    this.logger.debug('Get by Conversion ID.', { request });

    const { userId, id } = request;

    const user = new UserEntity({ uuid: userId });
    const conversion = await this.usecase.execute(user, id);

    if (!conversion) return null;

    const response = new GetConversionByUserAndIdResponse({
      id: conversion.id,
      operationId: conversion.operation?.id,
      quotationId: conversion.quotation?.id,
      currencyId: conversion.currency?.id,
      side: conversion.conversionType,
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
      createdAt: conversion.createdAt,
    });

    return response;
  }
}
