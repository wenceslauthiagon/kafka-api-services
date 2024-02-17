import { Logger } from 'winston';
import { getMoment, formatToYearMonthDay } from '@zro/common';
import {
  PixStatementRepository,
  PixStatementEntity,
  PixStatement,
  PixStatementCurrentPageRepository,
  PixStatementCurrentPageEntity,
} from '@zro/api-topazio/domain';
import {
  PixStatementGateway,
  GetStatementPixStatementRequest,
  GetStatementPixStatementResponse,
} from '@zro/api-topazio/application';

export class UpdatePixStatementUseCase {
  /**
   * The page size to request pix statements from psp.
   */
  private readonly PAGE_SIZE = 100;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixStatementRepository PixStatement repository.
   * @param pixStatementCurrentPageRepository PixStatementCurrentPage repository.
   * @param pspGateway PSP gateway instance.
   */
  constructor(
    private logger: Logger,
    private readonly pixStatementRepository: PixStatementRepository,
    private readonly pixStatementCurrentPageRepository: PixStatementCurrentPageRepository,
    private readonly pspGateway: PixStatementGateway,
  ) {
    this.logger = logger.child({ context: UpdatePixStatementUseCase.name });
  }

  /**
   * Update all pix statements from PSP.
   */
  async execute(endToEndIdsFilter?: string): Promise<PixStatement[]> {
    let hasNextPage = true;
    const pixStatementsCreated = [];

    const currentPage =
      await this.pixStatementCurrentPageRepository.getCurrentPage();

    this.logger.debug('Current page found.', { currentPage });

    let actualPage = currentPage?.actualPage || 1;
    const updateDate = currentPage?.createdDate
      ? getMoment(currentPage?.createdDate).toDate()
      : getMoment().toDate();

    // Get all interval dates from currentPage?.createdDate to now
    const intervalDates = this.getIntervalDates(updateDate);

    this.logger.debug('Interval dates for run update.', { intervalDates });

    // Run first day from page getCurrentPage, the next days will start from page 1
    for (const newUpdateDate of intervalDates) {
      for (;;) {
        this.logger.debug(
          `Update pixStatements for page ${actualPage} and date ${newUpdateDate}.`,
        );

        const request: GetStatementPixStatementRequest = {
          page: actualPage,
          size: this.PAGE_SIZE,
          startDate: newUpdateDate,
          endDate: newUpdateDate,
        };

        const result = await this.pspGateway.getStatement(request);

        if (result.length) {
          this.logger.debug('Found pixStatements length.', {
            statements: result.length,
          });

          const newStatements = this.filterStatements(
            endToEndIdsFilter,
            result,
          );

          const newPixStatement = new PixStatementEntity({
            page: actualPage,
            size: newStatements.length,
            createdDate: getMoment(newUpdateDate).format('YYYY-MM-DD'),
            statements: newStatements,
          });

          await this.pixStatementRepository.create(newPixStatement);
          pixStatementsCreated.push(newPixStatement);

          this.logger.debug('Create pixStatements.', { newPixStatement });

          hasNextPage = result.length >= this.PAGE_SIZE;

          const newCurrentPage = new PixStatementCurrentPageEntity({
            actualPage,
            createdDate: formatToYearMonthDay(newUpdateDate),
          });

          await this.pixStatementCurrentPageRepository.createOrUpdate(
            newCurrentPage,
          );

          actualPage++;
        } else {
          hasNextPage = false;
        }

        // When finish update for the first day, the next day will start with page 1
        if (!hasNextPage) {
          actualPage = 1;
          break;
        }
      }
    }

    return pixStatementsCreated;
  }

  private getIntervalDates(actualDate: Date) {
    const startDate = getMoment(actualDate);
    const endDate = getMoment();
    const dates = [startDate.toDate()];

    while (startDate.add(1, 'days').diff(endDate) < 0) {
      dates.push(startDate.clone().toDate());
    }

    return dates;
  }

  private filterStatements(
    endToEndIdsFilter: string,
    result: GetStatementPixStatementResponse[],
  ): GetStatementPixStatementResponse[] {
    this.logger.debug('EndToEndIds for filter', {
      endToEndIds: endToEndIdsFilter,
    });
    if (endToEndIdsFilter) {
      return result.filter((values) =>
        endToEndIdsFilter.includes(values.endToEndId),
      );
    }

    return result;
  }
}
