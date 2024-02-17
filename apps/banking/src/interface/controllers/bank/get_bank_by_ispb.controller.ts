import { Logger } from 'winston';
import { IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Bank, BankRepository } from '@zro/banking/domain';
import { GetBankByIspbUseCase as UseCase } from '@zro/banking/application';

type TGetBankByIspbRequest = Pick<Bank, 'ispb'>;

export class GetBankByIspbRequest
  extends AutoValidator
  implements TGetBankByIspbRequest
{
  @IsString()
  @Length(8, 8)
  ispb: string;

  constructor(props: TGetBankByIspbRequest) {
    super(props);
  }
}

type TGetBankByIspbResponse = Pick<Bank, 'id' | 'ispb' | 'name' | 'createdAt'>;

export class GetBankByIspbResponse
  extends AutoValidator
  implements TGetBankByIspbResponse
{
  @IsUUID(4)
  id: string;

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

  constructor(props: TGetBankByIspbResponse) {
    super(props);
  }
}

export class GetBankByIspbController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankRepository: BankRepository,
  ) {
    this.logger = logger.child({ context: GetBankByIspbController.name });

    this.usecase = new UseCase(this.logger, bankRepository);
  }

  async execute(request: GetBankByIspbRequest): Promise<GetBankByIspbResponse> {
    this.logger.debug('Getting bank by ispb request.', { request });

    const { ispb } = request;

    const bank = await this.usecase.execute(ispb);

    if (!bank) return null;

    const response = new GetBankByIspbResponse({
      id: bank.id,
      name: bank.name,
      ispb: bank.ispb,
      createdAt: bank.createdAt,
    });

    this.logger.debug('Getting bank by ispb response.', { bank: response });

    return response;
  }
}
