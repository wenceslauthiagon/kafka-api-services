import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';
import {
  AutoValidator,
  IsBiggestThan,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  IsSmallerThan,
  Pagination,
  PaginationEntity,
  PaginationRequest,
  PaginationResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { GetAllRemittanceOrdersByFilterUseCase as UseCase } from '@zro/otc/application';
import {
  Provider,
  RemittanceOrder,
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRepository,
  RemittanceOrderSide,
  RemittanceOrderStatus,
  RemittanceOrderType,
  RemittanceStatus,
  System,
  TGetRemittanceOrdersFilter,
} from '@zro/otc/domain';

export enum GetAllRemittanceOrdersByFilterRequestSort {
  CREATED_AT = 'created_at',
}

type TGetAllRemittanceOrdersByFilterRequest = Pagination &
  TGetRemittanceOrdersFilter;

export class GetAllRemittanceOrdersByFilterRequest
  extends PaginationRequest
  implements TGetAllRemittanceOrdersByFilterRequest
{
  @IsOptional()
  @Sort(GetAllRemittanceOrdersByFilterRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsEnum(RemittanceOrderSide)
  side?: RemittanceOrderSide;

  @IsOptional()
  @IsInt()
  currencyId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsSmallerThan('amountEnd', true, {
    message: 'amountStart must be smaller than amountEnd',
  })
  amountStart?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsBiggestThan('amountStart', true, {
    message: 'amountEnd must be biggest than amountStart',
  })
  amountEnd?: number;

  @IsOptional()
  @IsEnum(RemittanceOrderStatus)
  status?: RemittanceOrderStatus;

  @IsOptional()
  @IsUUID(4)
  systemId?: string;

  @IsOptional()
  @IsUUID(4)
  providerId?: string;

  @IsOptional()
  @IsEnum(RemittanceOrderType)
  type?: RemittanceOrderType;

  @IsOptional()
  @IsUUID(4)
  remittanceId?: string;

  @IsOptional()
  @IsEnum(RemittanceStatus)
  remittanceStatus?: RemittanceStatus;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updatedAtStart',
  })
  @IsDateBeforeThan('updatedAtEnd', false, {
    message: 'updatedAtStart must be before than updatedAtEnd',
  })
  updatedAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updatedAtEnd',
  })
  @IsDateAfterThan('updatedAtStart', false, {
    message: 'updatedAtEnd must be after than updatedAtStart',
  })
  updatedAtEnd?: Date;

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

  constructor(props: TGetAllRemittanceOrdersByFilterRequest) {
    super(props);
  }
}

type TGetAllRemittanceOrdersByFilterResponseItem = Pick<
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
  remittances?: [];
};

export class GetAllRemittanceOrdersByFilterResponseItem
  extends AutoValidator
  implements TGetAllRemittanceOrdersByFilterResponseItem
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

  constructor(props: TGetAllRemittanceOrdersByFilterResponseItem) {
    super(props);
  }
}

export class GetAllRemittanceOrdersByFilterResponse extends PaginationResponse<GetAllRemittanceOrdersByFilterResponseItem> {}

export class GetAllRemittanceOrdersByFilterController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
    remittanceOrderRepository: RemittanceOrderRepository,
  ) {
    this.logger = logger.child({
      context: GetAllRemittanceOrdersByFilterController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      remittanceOrderRemittanceRepository,
      remittanceOrderRepository,
    );
  }

  async execute(
    request: GetAllRemittanceOrdersByFilterRequest,
  ): Promise<GetAllRemittanceOrdersByFilterResponse> {
    this.logger.debug('Get all remittance orders by filter request.', {
      request,
    });

    const {
      side,
      currencyId,
      amountStart,
      amountEnd,
      status,
      systemId,
      providerId,
      type,
      createdAtStart,
      createdAtEnd,
      updatedAtStart,
      updatedAtEnd,
      remittanceId,
      remittanceStatus,
      order,
      page,
      pageSize,
      sort,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const filter: TGetRemittanceOrdersFilter = {
      ...(side && { side }),
      ...(currencyId && { currencyId }),
      ...(amountStart && { amountStart }),
      ...(amountEnd && { amountEnd }),
      ...(status && { status }),
      ...(systemId && { systemId }),
      ...(providerId && { providerId }),
      ...(type && { type }),
      ...(createdAtStart && { createdAtStart }),
      ...(createdAtEnd && { createdAtEnd }),
      ...(updatedAtStart && { updatedAtStart }),
      ...(updatedAtEnd && { updatedAtEnd }),
      ...(remittanceId && { remittanceId }),
      ...(remittanceStatus && { remittanceStatus }),
    };

    const result = await this.usecase.execute(pagination, filter);

    const data = result.data.map((remittanceOrder) => {
      return new GetAllRemittanceOrdersByFilterResponseItem({
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
    });

    const response = new GetAllRemittanceOrdersByFilterResponse({
      ...result,
      data,
    });

    this.logger.debug('Get all remittance orders by filter response.', {
      remittanceOrders: response,
    });

    return response;
  }
}
