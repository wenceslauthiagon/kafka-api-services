import { Logger } from 'winston';
import {
  IsOptional,
  IsInt,
  IsEnum,
  IsString,
  IsBoolean,
  IsObject,
  isDefined,
  IsUUID,
} from 'class-validator';
import {
  IsIsoStringDateFormat,
  IsSmallerThan,
  IsBiggestThan,
  AutoValidator,
  Pagination,
  PaginationSort,
  PaginationResponse,
  PaginationEntity,
  PaginationRequest,
  IsDateBeforeThan,
  IsDateAfterThan,
  Sort,
} from '@zro/common';
import {
  RemittanceRepository,
  Remittance,
  RemittanceStatus,
  RemittanceSide,
  GetAllRemittanceFilter,
  Provider,
  System,
} from '@zro/otc/domain';
import { GetAllRemittanceUseCase as UseCase } from '@zro/otc/application';

export enum GetAllRemittanceSort {
  CREATED_AT = 'created_at',
}

type TGetAllRemittanceRequest = Pagination & GetAllRemittanceFilter;

export class GetAllRemittanceRequest
  extends PaginationRequest
  implements TGetAllRemittanceRequest
{
  @IsOptional()
  @Sort(GetAllRemittanceSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsEnum(RemittanceStatus)
  status?: RemittanceStatus;

  @IsOptional()
  @IsUUID(4)
  orderId?: string;

  @IsOptional()
  @IsUUID(4)
  contractId?: string;

  @IsOptional()
  @IsUUID(4)
  providerId?: string;

  @IsOptional()
  @IsInt()
  @IsSmallerThan('amountEnd', true, {
    message: 'amountStart must be smaller than amountEnd',
  })
  amountStart?: number;

  @IsOptional()
  @IsInt()
  @IsBiggestThan('amountStart', true, {
    message: 'amountEnd must be biggest than amountStart',
  })
  amountEnd?: number;

  @IsOptional()
  @IsEnum(RemittanceSide)
  side?: RemittanceSide;

  @IsOptional()
  @IsString()
  systemId?: string;

  @IsOptional()
  @IsInt()
  @IsSmallerThan('resultAmountEnd', true, {
    message: 'resultAmountStart must be smaller than resultAmountEnd',
  })
  resultAmountStart?: number;

  @IsOptional()
  @IsInt()
  @IsBiggestThan('resultAmountStart', true, {
    message: 'amountEnd must be biggest than resultAmountStart',
  })
  resultAmountEnd?: number;

  @IsOptional()
  @IsInt()
  @IsSmallerThan('bankQuoteEnd', true, {
    message: 'bankQuoteStart must be smaller than bankQuoteEnd',
  })
  bankQuoteStart?: number;

  @IsOptional()
  @IsInt()
  @IsBiggestThan('bankQuoteStart', true, {
    message: 'bankQuoteEnd must be biggest than bankQuoteStart',
  })
  bankQuoteEnd?: number;

  @IsOptional()
  @IsBoolean()
  isConcomitant?: boolean;

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

  constructor(props: TGetAllRemittanceRequest) {
    super(props);
  }
}

type TGetAllRemittanceResponseItem = Pick<
  Remittance,
  | 'id'
  | 'provider'
  | 'status'
  | 'amount'
  | 'iof'
  | 'side'
  | 'system'
  | 'bankQuote'
  | 'resultAmount'
  | 'sendDate'
  | 'receiveDate'
  | 'isConcomitant'
  | 'createdAt'
  | 'updatedAt'
> & { exchangeContractId: string };

export class GetAllRemittanceResponseItem
  extends AutoValidator
  implements TGetAllRemittanceResponseItem
{
  @IsUUID(4)
  id: string;

  @IsObject()
  @IsOptional()
  provider: Provider;

  @IsEnum(RemittanceStatus)
  status: RemittanceStatus;

  @IsInt()
  @IsOptional()
  amount: number;

  @IsInt()
  @IsOptional()
  iof: number;

  @IsEnum(RemittanceSide)
  @IsOptional()
  side: RemittanceSide;

  @IsObject()
  @IsOptional()
  system: System;

  @IsInt()
  @IsOptional()
  bankQuote: number;

  @IsInt()
  @IsOptional()
  resultAmount: number;

  @IsString()
  @IsOptional()
  exchangeContractId: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format sendDate',
  })
  sendDate: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format receiveDate',
  })
  receiveDate: Date;

  @IsBoolean()
  @IsOptional()
  isConcomitant: boolean;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  constructor(props: TGetAllRemittanceResponseItem) {
    super(props);
  }
}

export class GetAllRemittanceResponse extends PaginationResponse<GetAllRemittanceResponseItem> {}

export class GetAllRemittanceController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    remittanceRepository: RemittanceRepository,
  ) {
    this.logger = logger.child({
      context: GetAllRemittanceController.name,
    });

    this.usecase = new UseCase(this.logger, remittanceRepository);
  }

  async execute(
    request: GetAllRemittanceRequest,
  ): Promise<GetAllRemittanceResponse> {
    this.logger.debug('Get all remittance request.', { request });

    const {
      order,
      page,
      pageSize,
      sort,
      orderId,
      providerId,
      contractId,
      resultAmountStart,
      resultAmountEnd,
      bankQuoteStart,
      bankQuoteEnd,
      isConcomitant,
      status,
      amountStart,
      amountEnd,
      side,
      systemId,
      createdAtStart,
      createdAtEnd,
      updatedAtStart,
      updatedAtEnd,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const filter: GetAllRemittanceFilter = {
      ...(orderId && { orderId }),
      ...(amountStart && { amountStart }),
      ...(amountEnd && { amountEnd }),
      ...(bankQuoteStart && { bankQuoteStart }),
      ...(bankQuoteEnd && { bankQuoteEnd }),
      ...(isDefined(isConcomitant) && { isConcomitant }),
      ...(providerId && { providerId }),
      ...(contractId && { contractId }),
      ...(resultAmountStart && { resultAmountStart }),
      ...(resultAmountEnd && { resultAmountEnd }),
      ...(side && { side }),
      ...(status && { status }),
      ...(systemId && { systemId }),
      ...(createdAtStart && { createdAtStart }),
      ...(createdAtEnd && { createdAtEnd }),
      ...(updatedAtStart && { updatedAtStart }),
      ...(updatedAtEnd && { updatedAtEnd }),
    };

    const results = await this.usecase.execute(pagination, filter);

    const data = results.data.map(
      (remittance) =>
        new GetAllRemittanceResponseItem({
          id: remittance.id,
          provider: remittance.provider,
          status: remittance.status,
          amount: remittance.amount,
          iof: remittance.iof,
          side: remittance.side,
          system: remittance.system,
          bankQuote: remittance.bankQuote,
          resultAmount: remittance.resultAmount,
          exchangeContractId: remittance.exchangeContract?.id,
          sendDate: remittance.sendDate,
          receiveDate: remittance.receiveDate,
          isConcomitant: remittance.isConcomitant,
          createdAt: remittance.createdAt,
          updatedAt: remittance.updatedAt,
        }),
    );

    const response = new GetAllRemittanceResponse({ ...results, data });

    this.logger.debug('Get all remittance response.', {
      remittance: response,
    });

    return response;
  }
}
