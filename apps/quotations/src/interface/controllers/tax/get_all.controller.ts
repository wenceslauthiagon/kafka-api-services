import { Logger } from 'winston';
import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  Pagination,
  PaginationEntity,
  PaginationRequest,
  PaginationResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import { GetTaxFilter, Tax, TaxRepository } from '@zro/quotations/domain';
import { GetAllTaxUseCase as UseCase } from '@zro/quotations/application';

export enum GetAllTaxRequestSort {
  ID = 'id',
  CREATED_AT = 'created_at',
}

export type TGetAllTaxRequest = Pagination & GetTaxFilter;

export class GetAllTaxRequest
  extends PaginationRequest
  implements TGetAllTaxRequest
{
  @IsOptional()
  @Sort(GetAllTaxRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsString()
  name?: string;

  constructor(props: TGetAllTaxRequest) {
    super(props);
  }
}

type TGetAllTaxResponseItem = Pick<
  Tax,
  'id' | 'name' | 'value' | 'format' | 'formattedValue' | 'createdAt'
>;

export class GetAllTaxResponseItem
  extends AutoValidator
  implements TGetAllTaxResponseItem
{
  @IsUUID(4)
  id: string;

  @IsString()
  name: string;

  @IsInt()
  value: number;

  @IsString()
  format: string;

  @IsString()
  formattedValue: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetAllTaxResponseItem) {
    super(props);
  }
}

export class GetAllTaxResponse extends PaginationResponse<GetAllTaxResponseItem> {}

export class GetAllTaxController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    taxRepository: TaxRepository,
  ) {
    this.logger = logger.child({ context: GetAllTaxController.name });
    this.usecase = new UseCase(this.logger, taxRepository);
  }

  async execute(request: GetAllTaxRequest): Promise<GetAllTaxResponse> {
    this.logger.debug('Get all Taxes request.', { request });

    const { name, order, page, pageSize, sort } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const filter: GetTaxFilter = { ...(name && { name }) };

    const taxes = await this.usecase.execute(pagination, filter);

    const data = taxes.data.map(
      (tax) =>
        new GetAllTaxResponseItem({
          id: tax.id,
          name: tax.name,
          value: tax.value,
          format: tax.format,
          formattedValue: tax.formattedValue,
          createdAt: tax.createdAt,
        }),
    );

    const response = new GetAllTaxResponse({ ...taxes, data });

    return response;
  }
}
