import {
  AutoValidator,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
} from '@zro/common';
import {
  ReportService,
  UserService,
  SyncOperationsReportsUseCase as UseCase,
} from '@zro/operations/application';
import {
  CurrencyRepository,
  OperationRepository,
  WalletAccountRepository,
} from '@zro/operations/domain';
import { Logger } from 'winston';

export type TSyncOperationsReportsRequest = {
  createdAtStart: Date;
  createdAtEnd: Date;
};

export class SyncOperationsReportsRequest
  extends AutoValidator
  implements TSyncOperationsReportsRequest
{
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('createdAtEnd', true, {
    message: 'createdAtStart must be before than createdAtEnd',
  })
  createdAtStart: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('createdAtStart', true, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  createdAtEnd: Date;

  constructor(props: TSyncOperationsReportsRequest) {
    super(props);
  }
}

export class SyncOperationsReportsController {
  private usecase: UseCase;
  private transactionType: string;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param operationRepository Operation Repository.
   * @param currencyRepository Currency Repository.
   * @param walletAccountRepository WalletAccount Repository.
   * @param reportService Report Service.
   * @param userService User service.
   * @param transactionType Transaction type.
   * @param bankCode Client bank code.
   * @param currencySymbol Currency symbol.
   */
  constructor(
    private logger: Logger,
    operationRepository: OperationRepository,
    currencyRepository: CurrencyRepository,
    walletAccountRepository: WalletAccountRepository,
    reportService: ReportService,
    userService: UserService,
    transactionType: string,
    bankCode: string,
    currencySymbol: string,
  ) {
    this.logger = logger.child({
      context: SyncOperationsReportsController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      operationRepository,
      currencyRepository,
      walletAccountRepository,
      reportService,
      userService,
      transactionType,
      bankCode,
      currencySymbol,
    );

    this.transactionType = transactionType;
  }

  async execute(request: SyncOperationsReportsRequest): Promise<void> {
    this.logger.debug(`Sync ${this.transactionType} reports.`, {
      request,
    });

    await this.usecase.execute({
      createdAtStart: request.createdAtStart,
      createdAtEnd: request.createdAtEnd,
    });
  }
}
