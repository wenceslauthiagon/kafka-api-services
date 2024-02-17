import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { Conversion, ConversionRepository } from '@zro/otc/domain';
import { QuotationService } from '@zro/otc/application';

export class GetQuotationByConversionIdAndUserUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param conversionRepository Conversion repository.
   * @param quotationService Quotation service
   */
  constructor(
    private logger: Logger,
    private readonly conversionRepository: ConversionRepository,
    private readonly quotationService: QuotationService,
  ) {
    this.logger = logger.child({
      context: GetQuotationByConversionIdAndUserUseCase.name,
    });
  }

  /**
   * Get the quotation by user and conversion id.
   *
   * @param user conversion owner.
   * @param id Conversion id.
   * @returns Quotation found.
   */
  async execute(user: User, id: string): Promise<Conversion['quotation']> {
    // Data input check
    if (!user?.uuid || !id) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!id ? ['ID'] : []),
      ]);
    }

    // Search conversion
    const conversion = await this.conversionRepository.getByUserAndId(user, id);

    this.logger.debug('Conversion found.', { conversion });

    const result =
      conversion?.quotation?.id &&
      (await this.quotationService.getQuotationById(conversion.quotation));

    this.logger.debug('Quotation found.', { result });

    return result;
  }
}
