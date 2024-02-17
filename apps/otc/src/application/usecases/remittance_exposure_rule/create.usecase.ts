import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  RemittanceExposureRule,
  RemittanceExposureRuleRepository,
} from '@zro/otc/domain';
import { CurrencyNotFoundException } from '@zro/operations/application';
import {
  OperationService,
  RemittanceExposureRuleEventEmitter,
  RemittanceExposureRuleAlreadyExistsException,
} from '@zro/otc/application';

export class CreateRemittanceExposureRuleUseCase {
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
      context: CreateRemittanceExposureRuleUseCase.name,
    });
  }

  async execute(
    remittanceExposureRule: RemittanceExposureRule,
  ): Promise<RemittanceExposureRule> {
    // Data input check
    if (
      !remittanceExposureRule?.id ||
      !remittanceExposureRule?.currency?.symbol ||
      !remittanceExposureRule?.amount ||
      !remittanceExposureRule?.seconds
    ) {
      throw new MissingDataException([
        ...(!remittanceExposureRule?.id ? ['ID'] : []),
        ...(!remittanceExposureRule?.currency?.symbol
          ? ['Currency Symbol']
          : []),
        ...(!remittanceExposureRule?.amount ? ['Amount'] : []),
        ...(!remittanceExposureRule?.seconds ? ['Seconds'] : []),
      ]);
    }
    // Check idempotency
    let existentRemittanceExposureRule =
      await this.remittanceExposureRuleRepository.getById(
        remittanceExposureRule.id,
      );

    this.logger.debug('Check if remittance exposure rule already exists.', {
      remittanceExposureRule: existentRemittanceExposureRule,
    });

    if (existentRemittanceExposureRule) {
      return existentRemittanceExposureRule;
    }

    const currency = await this.operationService.getCurrencyBySymbol(
      remittanceExposureRule.currency.symbol,
    );

    this.logger.debug('Currency found.', {
      currency,
    });

    if (!currency) {
      throw new CurrencyNotFoundException(remittanceExposureRule.currency);
    }

    // Check if there is any existent rule for this currency
    existentRemittanceExposureRule =
      await this.remittanceExposureRuleRepository.getByCurrency(currency);

    this.logger.debug('Found existent remittance exposure rule.', {
      remittanceExposureRule: existentRemittanceExposureRule,
    });

    if (existentRemittanceExposureRule) {
      throw new RemittanceExposureRuleAlreadyExistsException(
        existentRemittanceExposureRule,
      );
    }

    Object.assign(remittanceExposureRule.currency, currency);

    await this.remittanceExposureRuleRepository.create(remittanceExposureRule);

    this.remittanceExposureRuleEventEmitter.createdRemittanceExposureRule(
      remittanceExposureRule,
    );

    return remittanceExposureRule;
  }
}
