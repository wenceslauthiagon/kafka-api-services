import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Currency, Operation, OperationEntity } from '@zro/operations/domain';
import { Conversion, ConversionRepository, OrderSide } from '@zro/otc/domain';
import { GetConversionByOperationUseCase as UseCase } from '@zro/otc/application';
import { Quotation } from '@zro/quotations/domain';

type OperationId = Operation['id'];
type CurrencyId = Currency['id'];
type QuotationId = Quotation['id'];

export type TGetConversionByOperationRequest = {
  operationId: OperationId;
};

export class GetConversionByOperationRequest
  extends AutoValidator
  implements TGetConversionByOperationRequest
{
  @IsUUID(4)
  operationId: Operation['id'];

  constructor(props: TGetConversionByOperationRequest) {
    super(props);
  }
}

type TGetConversionByOperationResponse = Pick<
  Conversion,
  | 'id'
  | 'conversionType'
  | 'amount'
  | 'quote'
  | 'usdAmount'
  | 'usdQuote'
  | 'createdAt'
> & {
  operationId: OperationId;
  currencyId: CurrencyId;
  quotationId: QuotationId;
};

export class GetConversionByOperationResponse
  extends AutoValidator
  implements TGetConversionByOperationResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  operationId: OperationId;

  @IsInt()
  @IsPositive()
  currencyId: CurrencyId;

  @IsUUID(4)
  quotationId: QuotationId;

  @IsOptional()
  @IsEnum(OrderSide)
  conversionType: OrderSide;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientDocument?: string;

  @IsOptional()
  @IsInt()
  amount?: number;

  @IsOptional()
  @IsString()
  quote?: string;

  @IsOptional()
  @IsInt()
  usdAmount: number;

  @IsOptional()
  @IsInt()
  usdQuote?: number;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt?: Date;

  constructor(props: TGetConversionByOperationResponse) {
    super(props);
  }
}

export class GetConversionByOperationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    conversionRepository: ConversionRepository,
  ) {
    this.logger = logger.child({
      context: GetConversionByOperationController.name,
    });

    this.usecase = new UseCase(this.logger, conversionRepository);
  }

  async execute(
    request: GetConversionByOperationRequest,
  ): Promise<GetConversionByOperationResponse> {
    this.logger.debug('Get by Conversion ID.', { request });

    const { operationId } = request;

    const operation = new OperationEntity({ id: operationId });
    const conversion = await this.usecase.execute(operation);

    if (!conversion) return null;

    const response = new GetConversionByOperationResponse({
      id: conversion.id,
      operationId: conversion.operation.id,
      currencyId: conversion.currency.id,
      quotationId: conversion.quotation.id,
      conversionType: conversion.conversionType,
      amount: conversion.amount,
      quote: conversion.quote,
      usdAmount: conversion.usdAmount,
      usdQuote: conversion.usdQuote,
      createdAt: conversion.createdAt,
    });

    return response;
  }
}
