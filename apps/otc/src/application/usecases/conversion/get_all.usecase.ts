import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency } from '@zro/operations/domain';
import {
  Conversion,
  TGetConversionFilter,
  ConversionRepository,
} from '@zro/otc/domain';
import { CurrencyNotFoundException } from '@zro/operations/application';
import { OperationService, QuotationService } from '@zro/otc/application';

export class GetAllConversionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param conversionRepository ConversionRepository repository.
   * @param operationService Operation service.
   * @param quotationService Quotation service
   */
  constructor(
    private logger: Logger,
    private readonly conversionRepository: ConversionRepository,
    private readonly operationService: OperationService,
    private readonly quotationService: QuotationService,
  ) {
    this.logger = logger.child({ context: GetAllConversionUseCase.name });
  }

  /**
   * Get Conversion.
   *
   * @param filter Filter Conversion.
   * @param user conversion owner.
   * @returns Conversion.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    user: User,
    pagination: Pagination,
    filter?: TGetConversionFilter,
  ): Promise<TPaginationResponse<Conversion>> {
    // Data input check
    if (!user?.uuid || !pagination) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!pagination ? ['Pagination'] : []),
      ]);
    }

    // Add filter currencyId if user sent currencySymbol
    let currency: Currency;
    if (filter?.currencySymbol) {
      currency = await this.operationService.getCurrencyBySymbol(
        filter.currencySymbol,
      );

      this.logger.debug('Currency found.', { currency });

      if (!currency) {
        throw new CurrencyNotFoundException({
          symbol: filter.currencySymbol,
        });
      }

      filter.currencyId = currency.id;
    }

    // Search conversions
    const result =
      await this.conversionRepository.getByFilterAndUserAndPagination(
        filter,
        user,
        pagination,
      );

    // Run all conversions result for add quotation and currency data if that exists
    for (const conversion of result.data) {
      if (filter?.currencyId) {
        conversion.currency = currency;
      } else if (conversion.currency?.id) {
        conversion.currency = await this.operationService.getCurrencyById(
          conversion.currency.id,
        );
      }

      if (conversion.quotation?.id) {
        conversion.quotation = await this.quotationService.getQuotationById(
          conversion.quotation,
        );
      }
    }

    this.logger.debug('Conversions found.', { result });

    return result;
  }
}
