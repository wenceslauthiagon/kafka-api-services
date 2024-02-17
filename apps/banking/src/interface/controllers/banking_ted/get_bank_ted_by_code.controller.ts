import { Logger } from 'winston';
import { IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { BankTed, BankTedRepository } from '@zro/banking/domain';
import { GetBankTedByCodeUseCase as UseCase } from '@zro/banking/application';

type TGetBankTedByCodeRequest = Pick<BankTed, 'code'>;

export class GetBankTedByCodeRequest
  extends AutoValidator
  implements TGetBankTedByCodeRequest
{
  @IsString()
  @MaxLength(255)
  code: string;

  constructor(props: TGetBankTedByCodeRequest) {
    super(props);
  }
}

type TGetBankTedByCodeResponse = Pick<
  BankTed,
  'id' | 'code' | 'ispb' | 'name' | 'createdAt'
>;

export class GetBankTedByCodeResponse
  extends AutoValidator
  implements TGetBankTedByCodeResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  @MaxLength(255)
  code: string;

  @IsString()
  @Length(8, 8)
  ispb: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetBankTedByCodeResponse) {
    super(props);
  }
}

export class GetBankTedByCodeController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankTedRepository: BankTedRepository,
  ) {
    this.logger = logger.child({ context: GetBankTedByCodeController.name });

    this.usecase = new UseCase(this.logger, bankTedRepository);
  }

  async execute(
    request: GetBankTedByCodeRequest,
  ): Promise<GetBankTedByCodeResponse> {
    this.logger.debug('Getting bankTed by code request.', { request });

    const { code } = request;

    const bankTed = await this.usecase.execute(code);

    if (!bankTed) return null;

    const response = new GetBankTedByCodeResponse({
      id: bankTed.id,
      name: bankTed.name,
      code: bankTed.code,
      ispb: bankTed.ispb,
      createdAt: bankTed.createdAt,
    });

    this.logger.info('Getting bankTed by code response.', {
      bankTed: response,
    });

    return response;
  }
}
