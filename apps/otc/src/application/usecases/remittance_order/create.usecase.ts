import { MissingDataException } from '@zro/common';
import {
  CurrencyInvalidTypeException,
  CurrencyNotFoundException,
} from '@zro/operations/application';
import { Currency, CurrencyType } from '@zro/operations/domain';
import {
  ProviderNotFoundException,
  SystemNotFoundException,
  OperationService,
  RemittanceOrderEventEmitter,
} from '@zro/otc/application';
import {
  Provider,
  ProviderRepository,
  RemittanceOrder,
  RemittanceOrderEntity,
  RemittanceOrderRepository,
  RemittanceOrderSide,
  RemittanceOrderStatus,
  RemittanceOrderType,
  System,
  SystemRepository,
} from '@zro/otc/domain';
import { Logger } from 'winston';

export class CreateRemittanceOrderUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param remittanceOrderRepository Remittance Order repository.
   * @param systemRepository System repository.
   * @param providerRepository Provider repository.
   * @param operationService Operation service.
   * @param remittanceOrderEventEmitter Remittance Order emiter.
   */
  constructor(
    private logger: Logger,
    private readonly remittanceOrderRepository: RemittanceOrderRepository,
    private readonly systemRepository: SystemRepository,
    private readonly providerRepository: ProviderRepository,
    private readonly operationService: OperationService,
    private readonly remittanceOrderEventEmitter: RemittanceOrderEventEmitter,
  ) {
    this.logger = logger.child({
      context: CreateRemittanceOrderUseCase.name,
    });
  }

  async execute(
    id: string,
    side: RemittanceOrderSide,
    currency: Currency,
    amount: number,
    system: System,
    provider: Provider,
    type: RemittanceOrderType,
  ): Promise<RemittanceOrder> {
    if (
      !id ||
      !side ||
      !system?.id ||
      !provider?.id ||
      !currency?.id ||
      !amount ||
      !type
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!side ? ['Remittance Side'] : []),
        ...(!system?.id ? ['System ID'] : []),
        ...(!provider?.id ? ['Provider ID'] : []),
        ...(!currency?.id ? ['Currency ID'] : []),
        ...(!amount ? ['Amount'] : []),
        ...(!type ? ['Remittance Order Type'] : []),
      ]);
    }

    // Search system
    const systemFound = await this.systemRepository.getById(system.id);

    this.logger.debug('System found.', { systemFound });

    if (!systemFound) {
      throw new SystemNotFoundException(system);
    }

    // Search currency
    const currencyFound = await this.operationService.getCurrencyById(
      currency.id,
    );

    this.logger.debug('Currency found.', { currencyFound });

    if (!currencyFound) {
      throw new CurrencyNotFoundException(currency);
    }

    // Validate currency type.
    if (currencyFound.type != CurrencyType.FIAT) {
      throw new CurrencyInvalidTypeException(currency);
    }

    // Search provider
    const providerFound = await this.providerRepository.getById(provider.id);

    this.logger.debug('Found provider.', { providerFound });

    if (!providerFound) {
      throw new ProviderNotFoundException(provider);
    }

    // Create new remittance order
    const newRemittanceOrder = new RemittanceOrderEntity({
      id,
      side,
      currency: currencyFound,
      amount,
      status: RemittanceOrderStatus.OPEN,
      system: systemFound,
      provider: providerFound,
      type,
    });

    // Create Remittance Order
    await this.remittanceOrderRepository.create(newRemittanceOrder);

    this.logger.debug('Created new remittance order.', {
      newRemittanceOrder,
    });

    this.remittanceOrderEventEmitter.createdRemittanceOrder(newRemittanceOrder);

    return newRemittanceOrder;
  }
}
