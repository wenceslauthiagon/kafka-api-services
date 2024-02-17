import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Holiday, HolidayRepository } from '@zro/quotations/domain';

export class GetHolidayByDateUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param holidayRepository Holiday repository.
   */
  constructor(
    private logger: Logger,
    private readonly holidayRepository: HolidayRepository,
  ) {
    this.logger = logger.child({ context: GetHolidayByDateUseCase.name });
  }

  /**
   * Get the Holiday by date.
   *
   * @param date Holiday's date.
   * @returns Holiday found.
   */
  async execute(date: Date): Promise<Holiday> {
    // Data input check
    if (!date) {
      throw new MissingDataException(['Date']);
    }

    // Search holiday
    const result = await this.holidayRepository.getByDate(date);

    this.logger.debug('Found holiday.', { result });

    return result;
  }
}
