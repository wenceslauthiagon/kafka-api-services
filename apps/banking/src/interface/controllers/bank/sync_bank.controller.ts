import { Logger } from 'winston';
import {
  IsBoolean,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Bank, BankEntity, BankRepository } from '@zro/banking/domain';
import { SyncBankUseCase as UseCase } from '@zro/banking/application';
import {
  BankEventEmitterController,
  BankEventEmitterControllerInterface,
} from '@zro/banking/interface';

type TSyncBankRequest = Pick<
  Bank,
  'id' | 'ispb' | 'name' | 'fullName' | 'active' | 'startedAt'
>;

export class SyncBankRequest extends AutoValidator implements TSyncBankRequest {
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
    message: 'Invalid format startedAt',
  })
  startedAt: Date;

  constructor(props: TSyncBankRequest) {
    super(props);
  }
}

export class SyncBankController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankRepository: BankRepository,
    serviceEventEmitter: BankEventEmitterControllerInterface,
    zroBankIspb: string,
  ) {
    this.logger = logger.child({ context: SyncBankController.name });

    const eventEmitter = new BankEventEmitterController(serviceEventEmitter);
    this.usecase = new UseCase(
      this.logger,
      bankRepository,
      eventEmitter,
      zroBankIspb,
    );
  }

  async execute(request: SyncBankRequest[]): Promise<void> {
    this.logger.debug('Sync banks request.', { request: request.length });

    const body = request.map((item) => new BankEntity(item));

    return this.usecase.execute(body);
  }
}
