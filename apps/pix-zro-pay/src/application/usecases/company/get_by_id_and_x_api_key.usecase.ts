import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Company, CompanyRepository } from '@zro/pix-zro-pay/domain';

export class GetCompanyByIdAndXApiKeyUseCase {
  constructor(
    private logger: Logger,
    private readonly companyRepository: CompanyRepository,
  ) {
    this.logger = logger.child({
      context: GetCompanyByIdAndXApiKeyUseCase.name,
    });
  }

  async execute(id: number, xApiKey: string): Promise<Company> {
    // Data input check
    if (!id || !xApiKey) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!xApiKey ? ['X Api Key'] : []),
      ]);
    }

    const companyFound = await this.companyRepository.getByIdAndXApiKey(
      id,
      xApiKey,
    );

    this.logger.debug('Company Found.', { company: companyFound });

    return companyFound;
  }
}
