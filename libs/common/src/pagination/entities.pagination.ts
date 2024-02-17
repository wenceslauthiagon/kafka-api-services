import { camelCase } from 'camel-case';
import { Order } from 'sequelize/types';

export enum PaginationOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export type PaginationSort = string | string[];

export interface Pagination {
  page?: number;
  pageSize?: number;
  sort?: PaginationSort;
  order?: PaginationOrder;
}

export class PaginationEntity implements Pagination {
  page: number;
  pageSize: number;
  sort: PaginationSort;
  order: PaginationOrder;

  constructor(props: Pagination = {}) {
    this.page = props.page ?? 1;
    this.pageSize = props.pageSize ?? 20;
    this.sort =
      props.sort &&
      (Array.isArray(props.sort)
        ? props.sort.map((el) => camelCase(el))
        : camelCase(props.sort));
    this.order = props.order ?? PaginationOrder.ASC;
  }
}

export interface TPaginationResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  pageTotal: number;
  total: number;
}

export interface PaginationWhere {
  offset: number;
  limit: number;
  order: Order;
}
