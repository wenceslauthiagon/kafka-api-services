import { MissingDataException } from '@zro/common';
import {
  Remittance,
  RemittanceOrder,
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRepository,
} from '@zro/otc/domain';
import { Logger } from 'winston';
import { RemittanceOrderNotFoundException } from '@zro/otc/application';

type GetByIdResult = {
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
  remittances: Pick<Remittance, 'id' | 'status' | 'bankQuote'>[];
};

export class GetRemittanceOrderByIdUseCase {
  constructor(
    private logger: Logger,
    private remittanceOrderRepository: RemittanceOrderRepository,
    private remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
  ) {
    this.logger = logger.child({
      context: GetRemittanceOrderByIdUseCase.name,
    });
  }

  async execute(id: RemittanceOrder['id']): Promise<GetByIdResult> {
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    this.logger.debug('Getting remittance order', { id });

    const remittanceOrder = await this.remittanceOrderRepository.getById(id);

    this.logger.debug('Remittance order found', { remittanceOrder });

    if (!remittanceOrder) {
      throw new RemittanceOrderNotFoundException({ id });
    }

    const remittanceOrderRemittances =
      await this.remittanceOrderRemittanceRepository.getAllByRemittanceOrder(
        remittanceOrder,
      );

    this.logger.debug('Remittance order remittances found', {
      remittanceOrderRemittances,
    });

    const remittances = [];

    remittanceOrderRemittances.forEach((element) => {
      remittances.push({
        id: element.remittance.id,
        status: element.remittance.status,
        bankQuote: element.remittance.bankQuote,
      });
    });

    const result: GetByIdResult = {
      id: remittanceOrder.id,
      side: remittanceOrder.side,
      currency: remittanceOrder.currency,
      amount: remittanceOrder.amount,
      status: remittanceOrder.status,
      system: remittanceOrder.system,
      provider: remittanceOrder.provider,
      cryptoRemittance: remittanceOrder.cryptoRemittance,
      type: remittanceOrder.type,
      createdAt: remittanceOrder.createdAt,
      updatedAt: remittanceOrder.updatedAt,
      remittances: remittances,
    };

    return result;
  }
}
