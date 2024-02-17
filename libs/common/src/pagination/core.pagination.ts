import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { AutoValidator } from '../utils';
import {
  PaginationOrder,
  TPaginationResponse,
  Pagination,
  PaginationWhere,
  PaginationSort,
} from './entities.pagination';
import { IsSort } from '../decorators';

export class PaginationParams implements Pagination {
  @ApiPropertyOptional({
    description: 'Page number.',
    default: 1,
  })
  @Min(1)
  @IsInt()
  @IsOptional()
  @Transform((body) => body && parseInt(body.value, 10))
  page?: number;

  @ApiPropertyOptional({
    description: 'Page size. Max size is 100.',
    default: 20,
    maximum: 100,
  })
  @Min(1)
  @Max(100)
  @IsInt()
  @IsOptional()
  @Transform((body) => body && parseInt(body.value, 10))
  size?: number;

  @ApiPropertyOptional({
    description: 'Page sort attribute.',
  })
  @IsOptional()
  @IsSort()
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Page order.',
    default: PaginationOrder.ASC,
    enum: PaginationOrder,
  })
  @IsOptional()
  @IsEnum(PaginationOrder)
  order?: PaginationOrder;
}

export class PaginationRestResponse {
  @ApiProperty({
    description: 'Page number.',
    example: 1,
  })
  @IsInt()
  page!: number;

  @ApiProperty({
    description: 'Page size.',
    example: 20,
  })
  @IsInt()
  page_size!: number;

  @ApiProperty({
    description: 'Page total.',
    example: 20,
  })
  @IsInt()
  page_total!: number;

  @ApiProperty({
    description: 'Total of elements.',
    example: 100,
  })
  @IsInt()
  total!: number;

  constructor(props: TPaginationResponse<any>) {
    this.page = props.page;
    this.page_size = props.pageSize;
    this.page_total = props.pageTotal;
    this.total = props.total;
  }
}

export class PaginationRequest extends AutoValidator implements Pagination {
  @Min(1)
  @IsInt()
  @IsOptional()
  page?: number;

  @Min(1)
  @Max(100)
  @IsInt()
  @IsOptional()
  pageSize?: number;

  @IsOptional()
  @IsSort()
  sort?: PaginationSort;

  @IsEnum(PaginationOrder)
  @IsOptional()
  order?: PaginationOrder;

  constructor(props: Pagination) {
    super(props);
  }
}

export class PaginationResponse<T>
  extends AutoValidator
  implements TPaginationResponse<T>
{
  @Min(1)
  @IsInt()
  page: number;

  @Min(1)
  @Max(100)
  @IsInt()
  pageSize: number;

  @Min(0)
  @IsInt()
  pageTotal: number;

  @Min(0)
  @IsInt()
  total: number;

  @IsArray()
  data: T[];

  constructor(props: TPaginationResponse<T>) {
    super(props);
  }
}

export function paginationWhere(pagination: Pagination): PaginationWhere {
  return {
    offset: (pagination.page - 1) * pagination.pageSize,
    limit: pagination.pageSize,
    ...(pagination.sort &&
      (Array.isArray(pagination.sort)
        ? { order: pagination.sort.map((el) => [el, pagination.order]) }
        : { order: [[pagination.sort, pagination.order]] })),
  };
}

export function paginationToDomain<T = any>(
  pagination: Pagination,
  total: number,
  data: T[],
): TPaginationResponse<T> {
  return {
    data,
    page: pagination.page,
    pageSize: pagination.pageSize,
    pageTotal: total && Math.ceil(total / pagination.pageSize),
    total,
  };
}
