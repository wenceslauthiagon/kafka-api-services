import { Logger } from 'winston';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  AutoValidator,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  Pagination,
  PaginationEntity,
  PaginationRequest,
  PaginationResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import {
  CashOutSolicitation,
  CashOutSolicitationRepository,
  CashOutSolicitationStatus,
  CompanyRepository,
} from '@zro/pix-zro-pay/domain';
import { GetAllCashOutSolicitationUseCase as UseCase } from '@zro/pix-zro-pay/application';

export enum GetAllCashOutSolicitationSort {
  CREATED_AT = 'created_at',
}

export type TGetAllPaymentRequest = Pagination & {
  createdAtPeriodStart?: Date;
  createdAtPeriodEnd?: Date;
};

export class GetAllCashOutSolicitationRequest
  extends PaginationRequest
  implements TGetAllPaymentRequest
{
  @IsOptional()
  @Sort(GetAllCashOutSolicitationSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtPeriodStart',
  })
  @IsDateBeforeThan('createdAtPeriodEnd', false, {
    message: 'createdAtPeriodStart must be before than createdAtPeriodEnd',
  })
  createdAtPeriodStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtPeriodEnd',
  })
  @IsDateAfterThan('createdAtPeriodStart', false, {
    message: 'createdAtPeriodEnd must be after than createdAtPeriodStart',
  })
  createdAtPeriodEnd?: Date;
}

type TGetAllCashOutSolicitationResponseItem = Pick<
  CashOutSolicitation,
  'valueCents' | 'paymentDate' | 'status'
> & { companyName: string };

export class GetAllCashOutSolicitationResponseItem
  extends AutoValidator
  implements TGetAllCashOutSolicitationResponseItem
{
  @IsString()
  companyName: string;

  @IsNumber()
  valueCents: number;

  @IsDate()
  paymentDate: Date;

  @IsEnum(CashOutSolicitationStatus)
  status: CashOutSolicitationStatus;

  constructor(props: TGetAllCashOutSolicitationResponseItem) {
    super(props);
  }
}

export class GetAllCashOutSolicitationResponse extends PaginationResponse<GetAllCashOutSolicitationResponseItem> {}

export class GetAllCashOutSolicitationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    cashOutSolicitationRepository: CashOutSolicitationRepository,
    companyRepository: CompanyRepository,
  ) {
    this.logger = logger.child({
      context: GetAllCashOutSolicitationController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      cashOutSolicitationRepository,
      companyRepository,
    );
  }

  async execute(
    request: GetAllCashOutSolicitationRequest,
  ): Promise<GetAllCashOutSolicitationResponse> {
    this.logger.debug('Get All cashOutSolicitation request.');

    const {
      order,
      page,
      pageSize,
      sort,
      createdAtPeriodStart,
      createdAtPeriodEnd,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const results = await this.usecase.execute(
      pagination,
      createdAtPeriodStart,
      createdAtPeriodEnd,
    );

    const data = results.data.map(
      (item) =>
        new GetAllCashOutSolicitationResponseItem({
          companyName: item.company.name,
          paymentDate: item.paymentDate,
          status: item.status,
          valueCents: item.valueCents,
        }),
    );

    const response = new GetAllCashOutSolicitationResponse({
      ...results,
      data,
    });

    this.logger.info('Get All cashOutSolicitation response.', {
      cashOutSolicitations: response,
    });

    return response;
  }
}
