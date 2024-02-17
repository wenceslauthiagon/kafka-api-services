import { Pagination, TPaginationResponse } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { StreamPair } from '@zro/quotations/domain';

export type GetStreamPairFilter = {
  active?: boolean;
};

export interface StreamPairRepository {
  create(streamPair: StreamPair): Promise<StreamPair>;
  update(streamPair: StreamPair): Promise<StreamPair>;
  getById(id: string): Promise<StreamPair>;
  getAllActiveIsTrue(): Promise<StreamPair[]>;
  getAllByFilterAndPagination(
    pagination: Pagination,
    filter: GetStreamPairFilter,
  ): Promise<TPaginationResponse<StreamPair>>;
  getByGatewayNameAndActiveIsTrue(gatewayName: string): Promise<StreamPair[]>;
  getAllByBaseAndQuoteCurrencyAndActiveIsTrue(
    baseCurrency: Currency,
    quoteCurrency: Currency,
  ): Promise<StreamPair[]>;
}
