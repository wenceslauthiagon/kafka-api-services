import { Logger } from 'winston';
import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  BankingService,
  AdminBankingService,
  HandleNotifyRegisterBankingTedTopazioEventUseCase as UseCase,
} from '@zro/api-topazio/application';
import {
  NotifyRegisterBankingTed,
  NotifyRegisterBankingTedEntity,
  NotifyRegisterBankingTedRepository,
  NotifyRegisterBankingTedStatus,
} from '@zro/api-topazio/domain';

type THandleNotifyRegisterBankingTedTopazioEventRequest = Pick<
  NotifyRegisterBankingTed,
  'transactionId' | 'status' | 'code' | 'message'
>;

export class HandleNotifyRegisterBankingTedTopazioEventRequest
  extends AutoValidator
  implements THandleNotifyRegisterBankingTedTopazioEventRequest
{
  @IsUUID(4)
  transactionId: string;

  @IsEnum(NotifyRegisterBankingTedStatus)
  status: NotifyRegisterBankingTedStatus;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  message?: string;

  constructor(props: THandleNotifyRegisterBankingTedTopazioEventRequest) {
    super(props);
  }
}

export class HandleNotifyRegisterBankingTedTopazioEventController {
  /**
   * Handler triggered to create notify register banking ted.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyRegisterBankingTedRepository: NotifyRegisterBankingTedRepository,
    bankingService: BankingService,
    adminBankingService: AdminBankingService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyRegisterBankingTedTopazioEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      notifyRegisterBankingTedRepository,
      bankingService,
      adminBankingService,
    );
  }

  async execute(
    request: HandleNotifyRegisterBankingTedTopazioEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle create register banking ted event request.', {
      request,
    });

    const notifyRegister = new NotifyRegisterBankingTedEntity(request);
    await this.usecase.execute(notifyRegister);
  }
}
