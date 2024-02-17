import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import {
  RemittanceExposureRule,
  RemittanceExposureRuleRepository,
} from '@zro/otc/domain';
import { OperationService } from '@zro/otc/application';
import { Currency } from '@zro/operations/domain';

export class GetAllRemittanceExposureRuleUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param remittanceExposureRuleRepository Remittance Exposure Rule repository.
   * @param operationService Operation service.
   */
  constructor(
    private logger: Logger,
    private readonly remittanceExposureRuleRepository: RemittanceExposureRuleRepository,
    private readonly operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: GetAllRemittanceExposureRuleUseCase.name,
    });
  }

  async execute(
    pagination: Pagination,
    currency?: Currency,
  ): Promise<TPaginationResponse<RemittanceExposureRule>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    const currencyFound =
      currency &&
      (await this.operationService.getCurrencyBySymbol(currency.symbol));

    // Search remittance exposure rules
    const remittanceExposureRules =
      await this.remittanceExposureRuleRepository.getAll(
        pagination,
        currencyFound,
      );

    this.logger.debug('Found remittance exposure rules.', {
      remittanceExposureRule: remittanceExposureRules,
    });

    return remittanceExposureRules;
  }
}
