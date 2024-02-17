import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixStatementCurrentPageEntity,
  PixStatementCurrentPageRepository,
} from '@zro/api-topazio/domain';
import {
  UpdatePixStatementUseCase,
  SyncPixStatementUseCase,
} from '@zro/api-topazio/application';

export class HandleReprocessPixStatementEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixStatementCurrentPageRepository PixCurrentPageStatement repository.
   * @param updatePixStatementUseCase Update pix statement usecase.
   * @param syncPixStatementUseCase Sync pix statement usecase.
   */
  constructor(
    private logger: Logger,
    private readonly pixStatementCurrentPageRepository: PixStatementCurrentPageRepository,
    private readonly updatePixStatementUseCase: UpdatePixStatementUseCase,
    private readonly syncPixStatementUseCase: SyncPixStatementUseCase,
  ) {
    this.logger = logger.child({
      context: HandleReprocessPixStatementEventUseCase.name,
    });
  }

  /**
   * Reprocess pix statements.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    dateFrom: string,
    pageFrom: number,
    endToEndIdsFilter: string,
  ): Promise<void> {
    if (!dateFrom || !pageFrom) {
      throw new MissingDataException([
        ...(!dateFrom ? ['Date from start reprocess'] : []),
        ...(!pageFrom ? ['Page from start reprocess'] : []),
      ]);
    }

    this.logger.debug('Starting manual reprocess pix statements', {
      dateFrom,
      pageFrom,
    });

    const pixStatementCurrentPage = new PixStatementCurrentPageEntity({
      createdDate: dateFrom,
      actualPage: pageFrom,
    });

    await this.pixStatementCurrentPageRepository.createOrUpdate(
      pixStatementCurrentPage,
    );
    await this.updatePixStatementUseCase.execute(endToEndIdsFilter);
    await this.syncPixStatementUseCase.execute();

    this.logger.debug('Finish manual reprocess pix statements');
  }
}
