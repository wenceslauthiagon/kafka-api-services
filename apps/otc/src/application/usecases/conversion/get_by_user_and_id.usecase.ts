import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { Conversion, ConversionRepository } from '@zro/otc/domain';
import { OperationService, QuotationService } from '@zro/otc/application';

export class GetConversionByUserAndIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param conversionRepository Conversion repository.
   * @param operationService Operation service.
   * @param quotationService Quotation service
   */
  constructor(
    private logger: Logger,
    private readonly conversionRepository: ConversionRepository,
    private readonly operationService: OperationService,
    private readonly quotationService: QuotationService,
  ) {
    this.logger = logger.child({
      context: GetConversionByUserAndIdUseCase.name,
    });
  }

  /**
   * Get the conversion by user and id.
   *
   * @param user conversion owner.
   * @param id Conversion id.
   * @returns Conversion found.
   */
  async execute(user: User, id: string): Promise<Conversion> {
    // Data input check
    if (!user?.uuid || !id) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!id ? ['ID'] : []),
      ]);
    }

    // Search conversion
    const result = await this.conversionRepository.getByUserAndId(user, id);

    this.logger.debug('Conversion found.', { result });

    if (!result) return null;

    result.currency =
      result.currency?.id &&
      (await this.operationService.getCurrencyById(result.currency.id));

    result.quotation =
      result.quotation?.id &&
      (await this.quotationService.getQuotationById(result.quotation));

    return result;
  }
}
