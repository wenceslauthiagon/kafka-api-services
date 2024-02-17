import { Logger } from 'winston';
import {
  IsBoolean,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Bank, BankRepository } from '@zro/banking/domain';
import { UpdateBankUseCase as UseCase } from '@zro/banking/application';
import {
  BankEventEmitterController,
  BankEventEmitterControllerInterface,
} from '@zro/banking/interface';

type TUpdateBankRequest = Pick<Bank, 'id' | 'active'>;

export class UpdateBankRequest
  extends AutoValidator
  implements TUpdateBankRequest
{
  @IsUUID(4)
  id: string;

  @IsBoolean()
  active: boolean;

  constructor(props: TUpdateBankRequest) {
    super(props);
  }
}

type TUpdateBankResponse = Pick<
  Bank,
  'id' | 'ispb' | 'name' | 'fullName' | 'active' | 'createdAt'
>;

export class UpdateBankResponse
  extends AutoValidator
  implements TUpdateBankResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  @Length(8, 8)
  ispb: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(255)
  fullName: string;

  @IsBoolean()
  active: boolean;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TUpdateBankResponse) {
    super(props);
  }
}

export class UpdateBankController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankRepository: BankRepository,
    serviceEventEmitter: BankEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({ context: UpdateBankController.name });

    const eventEmitter = new BankEventEmitterController(serviceEventEmitter);
    this.usecase = new UseCase(this.logger, bankRepository, eventEmitter);
  }

  async execute(request: UpdateBankRequest): Promise<UpdateBankResponse> {
    this.logger.debug('Updating bank request.', { request });

    const { id, active } = request;

    const bank = await this.usecase.execute(id, active);

    if (!bank) return null;

    const response = new UpdateBankResponse({
      id: bank.id,
      ispb: bank.ispb,
      name: bank.name,
      fullName: bank.fullName,
      active: bank.active,
      createdAt: bank.createdAt,
    });

    this.logger.debug('Updating bank response.', { bank: response });

    return response;
  }
}
