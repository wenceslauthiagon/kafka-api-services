import { Logger } from 'winston';
import {
  PixStatementGateway,
  UpdatePixStatementUseCase as UseCase,
} from '@zro/api-topazio/application';
import {
  PixStatementCurrentPageRepository,
  PixStatementRepository,
} from '@zro/api-topazio/domain';

export class UpdatePixStatementController {
  private readonly usecase: UseCase;
  private endToEndIdsFilter: string;

  constructor(
    private logger: Logger,
    pixStatementRepository: PixStatementRepository,
    pixStatementCurrentPageRepository: PixStatementCurrentPageRepository,
    pspGateway: PixStatementGateway,
    endToEndIdsFilter: string,
  ) {
    this.logger = logger.child({ context: UpdatePixStatementController.name });

    this.usecase = new UseCase(
      this.logger,
      pixStatementRepository,
      pixStatementCurrentPageRepository,
      pspGateway,
    );

    this.endToEndIdsFilter = endToEndIdsFilter;
  }

  async execute(): Promise<void> {
    this.logger.debug('Update pix statements request.');

    await this.usecase.execute(this.endToEndIdsFilter);

    this.logger.info('Finish update pix statements.');
  }
}
