import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  RemittanceExposureRule,
  RemittanceExposureRuleRepository,
  SettlementDateRule,
} from '@zro/otc/domain';
import { CurrencyNotFoundException } from '@zro/operations/application';
import {
  OperationService,
  RemittanceExposureRuleEventEmitter,
  RemittanceExposureRuleNotFoundException,
  RemittanceExposureRuleAlreadyExistsException,
} from '@zro/otc/application';
import { Currency } from '@zro/operations/domain';

export class UpdateRemittanceExposureRuleUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param remittanceExposureRuleRepository Remittance Exposure Rule repository.
   * @param operationService Operation service.
   * @param remittanceExposureRuleEventEmitter Remittance exposure rule event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly remittanceExposureRuleRepository: RemittanceExposureRuleRepository,
    private readonly operationService: OperationService,
    private readonly remittanceExposureRuleEventEmitter: RemittanceExposureRuleEventEmitter,
  ) {
    this.logger = logger.child({
      context: UpdateRemittanceExposureRuleUseCase.name,
    });
  }

  async execute(
    id: string,
    currency?: Currency,
    amount?: number,
    seconds?: number,
    settlementDateRules?: SettlementDateRule[],
  ): Promise<RemittanceExposureRule> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['Remittance Exposure Rule ID']);
    }

    // Check if remittance exposure rule exists
    const remittanceExposureRule =
      await this.remittanceExposureRuleRepository.getById(id);

    this.logger.debug('Found remittance exposure rule.', {
      remittanceExposureRule: remittanceExposureRule,
    });

    if (!remittanceExposureRule) {
      throw new RemittanceExposureRuleNotFoundException({ id });
    }

    // If it is requested to change the currency, check if there is any existent rule for this new currency.
    if (currency?.symbol) {
      const currencyFound = await this.operationService.getCurrencyBySymbol(
        currency.symbol,
      );

      this.logger.debug('Currency found.', {
        currency: currencyFound,
      });

      if (!currencyFound) {
        throw new CurrencyNotFoundException(currency);
      }

      if (remittanceExposureRule.currency.symbol !== currencyFound.symbol) {
        const existentRemittanceExposureRule =
          await this.remittanceExposureRuleRepository.getByCurrency(
            currencyFound,
          );

        this.logger.debug('Found existent remittance exposure rule.', {
          remittanceExposureRule: existentRemittanceExposureRule,
        });

        if (existentRemittanceExposureRule) {
          throw new RemittanceExposureRuleAlreadyExistsException(
            existentRemittanceExposureRule,
          );
        }

        Object.assign(remittanceExposureRule.currency, currencyFound);
      }
    }

    Object.assign(remittanceExposureRule, {
      ...(amount && { amount }),
      ...(seconds && { seconds }),
      ...(settlementDateRules && { settlementDateRules }),
    });

    await this.remittanceExposureRuleRepository.update(remittanceExposureRule);

    this.logger.debug('Updated remittance exposure rule.', {
      remittanceExposureRule: remittanceExposureRule,
    });

    this.remittanceExposureRuleEventEmitter.updatedRemittanceExposureRule(
      remittanceExposureRule,
    );

    return remittanceExposureRule;
  }
}
