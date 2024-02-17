import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Holiday, HolidayRepository } from '@zro/quotations/domain';
import { HolidayNotFoundException } from '@zro/quotations/application';

export class UpdateHolidayByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param holidayRepository Holiday repository.
   */
  constructor(
    private logger: Logger,
    private readonly holidayRepository: HolidayRepository,
  ) {
    this.logger = logger.child({ context: UpdateHolidayByIdUseCase.name });
  }

  /**
   * Update Holiday by id.
   *
   * @param id Holiday id
   * @param startDate Holiday start date.
   * @param endDate Holiday end date.
   * @returns Holiday updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string, startDate: Date, endDate: Date): Promise<Holiday> {
    if (!id || !startDate || !endDate) {
      throw new MissingDataException([
        ...(!id ? ['id'] : []),
        ...(!startDate ? ['Start Date'] : []),
        ...(!endDate ? ['End Date'] : []),
      ]);
    }
    const holiday = await this.holidayRepository.getById(id);

    this.logger.debug('Holiday found.', { holiday });

    if (!holiday) {
      throw new HolidayNotFoundException(holiday);
    }

    holiday.startDate = startDate;
    holiday.endDate = endDate;

    await this.holidayRepository.update(holiday);

    return holiday;
  }
}
