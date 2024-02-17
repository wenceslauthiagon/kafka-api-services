import { Logger } from 'winston';
import {
  IsBoolean,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { BankTed, BankTedEntity, BankTedRepository } from '@zro/banking/domain';
import { SyncBankTedUseCase as UseCase } from '@zro/banking/application';
import {
  BankTedEventEmitterController,
  BankTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

type TSyncBankTedRequest = Pick<
  BankTed,
  'id' | 'code' | 'ispb' | 'name' | 'fullName' | 'active' | 'startedAt'
>;

export class SyncBankTedRequest
  extends AutoValidator
  implements TSyncBankTedRequest
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

  @IsString()
  @MaxLength(255)
  fullName: string;

  @IsBoolean()
  active: boolean;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format startedAt',
  })
  startedAt: Date;

  constructor(props: TSyncBankTedRequest) {
    super(props);
  }
}

export class SyncBankTedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankRepository: BankTedRepository,
    serviceEventEmitter: BankTedEventEmitterControllerInterface,
    zroBankTedCode: string,
  ) {
    this.logger = logger.child({ context: SyncBankTedController.name });

    const eventEmitter = new BankTedEventEmitterController(serviceEventEmitter);
    this.usecase = new UseCase(
      this.logger,
      bankRepository,
      eventEmitter,
      zroBankTedCode,
    );
  }

  async execute(request: SyncBankTedRequest[]): Promise<void> {
    this.logger.debug('Sync banks request.', { request: request.length });

    const body = request.map((item) => new BankTedEntity(item));

    return this.usecase.execute(body);
  }
}
