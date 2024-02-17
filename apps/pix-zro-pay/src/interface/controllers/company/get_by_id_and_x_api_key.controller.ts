import { Logger } from 'winston';
import { IsInt, IsPositive, IsString } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Company, CompanyRepository } from '@zro/pix-zro-pay/domain';
import { GetCompanyByIdAndXApiKeyUseCase as UseCase } from '@zro/pix-zro-pay/application';

type TGetCompanyByIdAndXApiKeyRequest = Pick<Company, 'id' | 'xApiKey'>;

export class GetCompanyByIdAndXApiKeyRequest
  extends AutoValidator
  implements TGetCompanyByIdAndXApiKeyRequest
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsString()
  xApiKey: string;

  constructor(props: TGetCompanyByIdAndXApiKeyRequest) {
    super(props);
  }
}

type TGetCompanyByIdAndXApiKeyResponse = Pick<
  Company,
  'id' | 'name' | 'cnpj' | 'createdAt'
>;

export class GetCompanyByIdAndXApiKeyResponse
  extends AutoValidator
  implements TGetCompanyByIdAndXApiKeyResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsString()
  name: string;

  @IsString()
  cnpj: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetCompanyByIdAndXApiKeyResponse) {
    super(props);
  }
}

export class GetCompanyByIdAndXApiKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    companyRepository: CompanyRepository,
  ) {
    this.logger = logger.child({
      context: GetCompanyByIdAndXApiKeyController.name,
    });

    this.usecase = new UseCase(this.logger, companyRepository);
  }

  async execute(
    request: GetCompanyByIdAndXApiKeyRequest,
  ): Promise<GetCompanyByIdAndXApiKeyResponse> {
    this.logger.debug('Get company by id and xApiKey request.', { request });

    const { id, xApiKey } = request;

    const company = await this.usecase.execute(id, xApiKey);

    if (!company) return null;

    const response = new GetCompanyByIdAndXApiKeyResponse({
      id: company.id,
      name: company.name,
      cnpj: company.cnpj,
      createdAt: company.createdAt,
    });

    this.logger.info('Get company by id and xApiKey response.', {
      company: response,
    });

    return response;
  }
}
