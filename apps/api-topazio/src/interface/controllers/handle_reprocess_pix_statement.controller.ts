import { Logger } from 'winston';
import {
  HandleReprocessPixStatementEventUseCase as UseCase,
  UpdatePixStatementUseCase,
  PixStatementGateway,
  SyncPixStatementUseCase,
  PixPaymentService,
} from '@zro/api-topazio/application';
import {
  FailedNotifyCreditRepository,
  PixStatementCurrentPageRepository,
  PixStatementRepository,
} from '@zro/api-topazio/domain';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  TranslateService,
} from '@zro/common';
import { IsArray, IsInt, IsOptional, Min } from 'class-validator';

type THandleReprocessPixStatementEventRequest = {
  dateFrom: string;
  pageFrom: number;
};

export class HandleReprocessPixStatementEventRequest
  extends AutoValidator
  implements THandleReprocessPixStatementEventRequest
{
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format createdDate',
  })
  dateFrom: string;

  @IsInt()
  @Min(1)
  pageFrom: number;

  @IsOptional()
  @IsArray()
  endToEndIds?: string[];

  constructor(props: THandleReprocessPixStatementEventRequest) {
    super(props);
  }
}

export class HandleReprocessPixStatementEventController {
  private readonly usecase: UseCase;
  private readonly updatePixStatementUseCase: UpdatePixStatementUseCase;
  private readonly syncPixStatementUseCase: SyncPixStatementUseCase;

  constructor(
    private logger: Logger,
    pixStatementRepository: PixStatementRepository,
    pixStatementCurrentPageRepository: PixStatementCurrentPageRepository,
    pspGateway: PixStatementGateway,
    pixPaymentService: PixPaymentService,
    private readonly apiTopazioZroBankIspb: string,
    failedNotifyCreditRepository: FailedNotifyCreditRepository,
    translateService: TranslateService,
  ) {
    this.logger = logger.child({
      context: HandleReprocessPixStatementEventController.name,
    });

    this.updatePixStatementUseCase = new UpdatePixStatementUseCase(
      this.logger,
      pixStatementRepository,
      pixStatementCurrentPageRepository,
      pspGateway,
    );

    this.syncPixStatementUseCase = new SyncPixStatementUseCase(
      this.logger,
      pixPaymentService,
      pixStatementRepository,
      failedNotifyCreditRepository,
      this.apiTopazioZroBankIspb,
      translateService,
    );

    this.usecase = new UseCase(
      this.logger,
      pixStatementCurrentPageRepository,
      this.updatePixStatementUseCase,
      this.syncPixStatementUseCase,
    );
  }

  async execute(
    request: HandleReprocessPixStatementEventRequest,
  ): Promise<void> {
    this.logger.debug('Reprocess pix statements request.', { request });

    const { dateFrom, pageFrom, endToEndIds } = request;

    let endToEndIdsFilter = '';
    if (endToEndIds?.length) {
      endToEndIdsFilter = endToEndIds.join(';');
    }

    await this.usecase.execute(dateFrom, pageFrom, endToEndIdsFilter);

    this.logger.debug('Finish reprocess pix statements.');
  }
}
