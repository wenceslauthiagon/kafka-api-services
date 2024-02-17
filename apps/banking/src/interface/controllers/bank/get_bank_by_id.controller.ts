import { Logger } from 'winston';
import { IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Bank, BankRepository } from '@zro/banking/domain';
import { GetBankByIdUseCase as UseCase } from '@zro/banking/application';

type TGetBankByIdRequest = Pick<Bank, 'id'>;

export class GetBankByIdRequest
  extends AutoValidator
  implements TGetBankByIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TGetBankByIdRequest) {
    super(props);
  }
}

type TGetBankByIdResponse = Pick<Bank, 'id' | 'ispb' | 'name' | 'createdAt'>;

export class GetBankByIdResponse
  extends AutoValidator
  implements TGetBankByIdResponse
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

  constructor(props: TGetBankByIdResponse) {
    super(props);
  }
}

export class GetBankByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankRepository: BankRepository,
  ) {
    this.logger = logger.child({ context: GetBankByIdController.name });

    this.usecase = new UseCase(this.logger, bankRepository);
  }

  async execute(request: GetBankByIdRequest): Promise<GetBankByIdResponse> {
    this.logger.debug('Getting bank by id request.', { request });

    const { id } = request;

    const bank = await this.usecase.execute(id);

    if (!bank) return null;

    const response = new GetBankByIdResponse({
      id: bank.id,
      name: bank.name,
      ispb: bank.ispb,
      createdAt: bank.createdAt,
    });

    this.logger.debug('Getting bank by ispb response.', { bank: response });

    return response;
  }
}
