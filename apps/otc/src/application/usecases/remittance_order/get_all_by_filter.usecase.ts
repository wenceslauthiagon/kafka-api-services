import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
} from '@zro/common';
import {
  RemittanceOrder,
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRepository,
  TGetRemittanceOrdersFilter,
} from '@zro/otc/domain';

type GetAllByFilterResult = {
  id: RemittanceOrder['id'];
  side: RemittanceOrder['side'];
  currency: RemittanceOrder['currency'];
  amount: RemittanceOrder['amount'];
  status: RemittanceOrder['status'];
  system: RemittanceOrder['system'];
  provider: RemittanceOrder['provider'];
  cryptoRemittance: RemittanceOrder['cryptoRemittance'];
  type: RemittanceOrder['type'];
  createdAt: RemittanceOrder['createdAt'];
  updatedAt: RemittanceOrder['updatedAt'];
  remittances: [];
};
export class GetAllRemittanceOrdersByFilterUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param RemittanceOrderRemittanceRepository Remittance order remittance repository.
   */
  constructor(
    private logger: Logger,
    private readonly remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
    private readonly remittanceOrderRepository: RemittanceOrderRepository,
  ) {
    this.logger = logger.child({
      context: GetAllRemittanceOrdersByFilterUseCase.name,
    });
  }

  /**
   * Get all Operations by filter.
   * @param pagination Pagination.
   * @param filter Filter.
   * @returns Operation[].
   */
  async execute(
    pagination: Pagination,
    filter: TGetRemittanceOrdersFilter,
  ): Promise<TPaginationResponse<GetAllByFilterResult>> {
    // Data input check
    if (!pagination || !filter) {
      throw new MissingDataException([
        ...(!pagination ? ['Pagination'] : []),
        ...(!filter ? ['Filter'] : []),
      ]);
    }

    const ror = await this.remittanceOrderRemittanceRepository.getAllByFilter(
      pagination,
      filter,
    );

    const groupResult: GetAllByFilterResult[] = ror.data.reduce(
      (accumulator, element) => {
        const groupExists = accumulator.find(
          (grupo) => grupo.id === element.remittanceOrder.id,
        );

        if (groupExists) {
          groupExists.remittances.push({
            id: element.remittance.id,
            status: element.remittance.status,
            bankQuote: element.remittance.bankQuote,
          });
        } else {
          accumulator.push({
            id: element.remittanceOrder.id,
            side: element.remittanceOrder.side,
            currency: element.remittanceOrder.currency,
            amount: element.remittanceOrder.amount,
            status: element.remittanceOrder.status,
            system: element.remittanceOrder.system,
            provider: element.remittanceOrder.provider,
            cryptoRemittance: element.remittanceOrder.cryptoRemittance,
            type: element.remittanceOrder.type,
            createdAt: element.remittanceOrder.createdAt,
            updatedAt: element.remittanceOrder.updatedAt,
            remittances: [
              {
                id: element.remittance.id,
                status: element.remittance.status,
                bankQuote: element.remittance.bankQuote,
              },
            ],
          });
        }

        return accumulator;
      },
      [],
    );

    if (!filter.remittanceId && !filter.remittanceStatus) {
      const ro = await this.remittanceOrderRepository.getAllByFilter(
        pagination,
        filter,
      );

      ro.data.forEach((element) => {
        const existsInGroupResult = groupResult.some(
          (item) => item.id === element.id,
        );

        if (!existsInGroupResult) {
          groupResult.push({
            id: element.id,
            side: element.side,
            currency: element.currency,
            amount: element.amount,
            status: element.status,
            system: element.system,
            provider: element.provider,
            cryptoRemittance: element.cryptoRemittance,
            type: element.type,
            createdAt: element.createdAt,
            updatedAt: element.updatedAt,
            remittances: [],
          });
        }
      });
    }

    const result = paginationToDomain(
      pagination,
      groupResult.length,
      groupResult,
    );

    this.logger.debug('Found remittance orders.', {
      remittanceOrders: result.total,
    });

    return result;
  }
}
