import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import {
  BotOtcOrder,
  BotOtcOrderRepository,
  TGetBotOtcOrdersFilter,
} from '@zro/otc-bot/domain';

export class GetAllBotOtcOrdersByFilterUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param botOtcOrderRepository Bot otc order repository.
   */
  constructor(
    private logger: Logger,
    private readonly botOtcOrderRepository: BotOtcOrderRepository,
  ) {
    this.logger = logger.child({
      context: GetAllBotOtcOrdersByFilterUseCase.name,
    });
  }

  /**
   * Get all bot otc orders by filter.
   * @param pagination Pagination.
   * @param filter Filter.
   * @returns TPaginationResponse<BotOtcOrder>.
   */
  async execute(
    pagination: Pagination,
    filter: TGetBotOtcOrdersFilter,
  ): Promise<TPaginationResponse<BotOtcOrder>> {
    // Data input check
    if (!pagination || !filter) {
      throw new MissingDataException([
        ...(!pagination ? ['Pagination'] : []),
        ...(!filter ? ['Filter'] : []),
      ]);
    }

    const result = await this.botOtcOrderRepository.getAllByFilter(
      pagination,
      filter,
    );

    this.logger.debug('Found bot otc orders.', {
      botOtcOrders: result.total,
    });

    return result;
  }
}
