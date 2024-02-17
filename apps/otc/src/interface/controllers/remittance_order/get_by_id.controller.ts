import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  Provider,
  Remittance,
  RemittanceOrder,
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRepository,
  RemittanceOrderSide,
  RemittanceOrderStatus,
  RemittanceOrderType,
  System,
} from '@zro/otc/domain';
import { GetRemittanceOrderByIdUseCase as UseCase } from '@zro/otc/application';
import { Currency } from '@zro/operations/domain';

export type TGetRemittanceOrderByIdRequest = Pick<RemittanceOrder, 'id'>;

export class GetRemittanceOrderByIdRequest
  extends AutoValidator
  implements TGetRemittanceOrderByIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TGetRemittanceOrderByIdRequest) {
    super(props);
  }
}

export type TGetRemittanceOrderByIdResponse = Pick<
  RemittanceOrder,
  | 'id'
  | 'side'
  | 'currency'
  | 'amount'
  | 'status'
  | 'system'
  | 'provider'
  | 'type'
  | 'createdAt'
  | 'updatedAt'
> & {
  remittances?: Pick<Remittance, 'id' | 'status' | 'bankQuote'>[];
};

export class GetRemittanceOrderByIdResponse
  extends AutoValidator
  implements TGetRemittanceOrderByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsEnum(RemittanceOrderSide)
  side: RemittanceOrderSide;

  @IsOptional()
  @IsObject()
  currency: Currency;

  @IsOptional()
  @IsInt()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsEnum(RemittanceOrderStatus)
  status: RemittanceOrderStatus;

  @IsOptional()
  @IsObject()
  system: System;

  @IsOptional()
  @IsObject()
  provider: Provider;

  @IsOptional()
  @IsEnum(RemittanceOrderType)
  type?: RemittanceOrderType;

  @IsOptional()
  remittances?: [];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetRemittanceOrderByIdResponse) {
    super(props);
  }
}

export class GetRemittanceOrderByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    remittanceOrderRepository: RemittanceOrderRepository,
    remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
  ) {
    this.logger = logger.child({
      context: GetRemittanceOrderByIdController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      remittanceOrderRepository,
      remittanceOrderRemittanceRepository,
    );
  }

  async execute(
    request: GetRemittanceOrderByIdRequest,
  ): Promise<GetRemittanceOrderByIdResponse> {
    const { id } = request;
    this.logger.debug('Get by Remittance Order ID.', { request });

    const remittanceOrder = await this.usecase.execute(id);

    const response = new GetRemittanceOrderByIdResponse({
      id: remittanceOrder.id,
      side: remittanceOrder.side,
      currency: remittanceOrder.currency,
      amount: remittanceOrder.amount,
      status: remittanceOrder.status,
      system: remittanceOrder.system,
      provider: remittanceOrder.provider,
      type: remittanceOrder.type,
      createdAt: remittanceOrder.createdAt,
      updatedAt: remittanceOrder.updatedAt,
      remittances: remittanceOrder.remittances,
    });

    return response;
  }
}
