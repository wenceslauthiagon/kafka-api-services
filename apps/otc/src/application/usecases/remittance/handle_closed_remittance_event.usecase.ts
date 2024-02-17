import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  RemittanceRepository,
  RemittanceStatus,
  RemittanceOrderRepository,
  RemittanceOrderRemittanceRepository,
  CryptoRemittanceRepository,
  CryptoOrderRepository,
  Remittance,
  System,
} from '@zro/otc/domain';
import {
  RemittanceNotFoundException,
  RemittanceInvalidStatusException,
  CryptoRemittanceNotFoundException,
  OtcBotService,
} from '@zro/otc/application';

export class HandleClosedRemittanceEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param remittanceRepository Remittance repository.
   * @param remittanceOrderRepository Remittance order repository.
   * @param remittanceOrderRemittanceRepository Remittance order remittance repository.
   * @param cryptoRemittanceRepository Crypto remittance repository.
   * @param cryptoOrderRepository Crypto order repository.
   * @param otcBotService OTC Bot service.
   */
  constructor(
    private logger: Logger,
    private readonly remittanceRepository: RemittanceRepository,
    private readonly remittanceOrderRepository: RemittanceOrderRepository,
    private readonly remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
    private readonly cryptoRemittanceRepository: CryptoRemittanceRepository,
    private readonly cryptoOrderRepository: CryptoOrderRepository,
    private readonly otcBotService: OtcBotService,
  ) {
    this.logger = logger.child({
      context: HandleClosedRemittanceEventUseCase.name,
    });
  }
  /**
   * Handler triggered when remittance was closed successfully.
   *
   * @param id remittance ID.
   * @param botOtcSystem Bot otc system ID.
   */
  async execute(remittance: Remittance, botOtcSystem: System): Promise<void> {
    // Data input check
    if (!remittance?.id || !remittance?.system?.id || !botOtcSystem) {
      throw new MissingDataException([
        ...(!remittance?.id ? ['Remittance ID'] : []),
        ...(!remittance?.system?.id ? ['Remittance system ID'] : []),
        ...(!botOtcSystem ? ['Bot OTC system'] : []),
      ]);
    }

    if (botOtcSystem.id !== remittance.system.id) return;

    const foundRemittance = await this.remittanceRepository.getById(
      remittance.id,
    );

    this.logger.debug('Remittance found.', { remittance: foundRemittance });

    if (!foundRemittance) {
      throw new RemittanceNotFoundException(remittance);
    }

    remittance = foundRemittance;

    if (
      remittance.status !== RemittanceStatus.CLOSED &&
      remittance.status !== RemittanceStatus.CLOSED_MANUALLY
    ) {
      throw new RemittanceInvalidStatusException(remittance);
    }

    const remittanceOrdersRemittances =
      await this.remittanceOrderRemittanceRepository.getAllByRemittance(
        remittance,
      );

    this.logger.debug('Remittance order Remittances found.', {
      remittanceOrdersRemittances,
    });

    if (!remittanceOrdersRemittances?.length) return;

    for (const remittanceOrderRemittance of remittanceOrdersRemittances) {
      const remittanceOrder = await this.remittanceOrderRepository.getById(
        remittanceOrderRemittance.remittanceOrder.id,
      );

      this.logger.debug('Remittance order found.', {
        remittanceOrder,
      });

      if (!remittanceOrder) return;

      const cryptoRemittance = await this.cryptoRemittanceRepository.getById(
        remittanceOrder.cryptoRemittance.id,
      );

      this.logger.debug('Crypto remittance found.', {
        cryptoRemittance,
      });

      if (!cryptoRemittance)
        throw new CryptoRemittanceNotFoundException(
          remittanceOrder.cryptoRemittance,
        );

      const cryptoOrders =
        await this.cryptoOrderRepository.getAllByCryptoRemittance(
          cryptoRemittance,
        );

      this.logger.debug('Crypto orders found.', {
        cryptoOrders,
      });

      if (!cryptoOrders?.length) continue;

      for (const cryptoOrder of cryptoOrders) {
        await this.otcBotService.updateBotOtcOrderByRemittance(
          cryptoOrder,
          remittance,
        );

        this.logger.debug('Bot Otc order updated.');
      }
    }
  }
}
