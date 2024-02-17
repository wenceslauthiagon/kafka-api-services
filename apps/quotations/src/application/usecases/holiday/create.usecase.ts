import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  Holiday,
  HolidayEntity,
  HolidayRepository,
  HolidayLevel,
  HolidayType,
} from '@zro/quotations/domain';

export class CreateHolidayUseCase {
  constructor(
    private logger: Logger,
    private readonly holidayRepository: HolidayRepository,
  ) {
    this.logger = logger.child({ context: CreateHolidayUseCase.name });
  }

  /**
   * Create holiday.
   * @returns The added holiday.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    id: string,
    startDate: Date,
    endDate: Date,
    name: string,
    level: HolidayLevel,
    type: HolidayType,
  ): Promise<Holiday> {
    // Data input sanitize
    if (!id || !startDate || !endDate || !name || !level || !type) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!startDate ? ['Start Date'] : []),
        ...(!endDate ? ['End Date'] : []),
        ...(!name ? ['Name'] : []),
        ...(!level ? ['Level'] : []),
        ...(!type ? ['Type'] : []),
      ]);
    }

    const foundHoliday = await this.holidayRepository.getById(id);

    this.logger.debug('Check if holiday id exists.', { foundHoliday });

    if (foundHoliday) {
      return foundHoliday;
    }

    const holiday = new HolidayEntity({
      id,
      startDate,
      endDate,
      name,
      level,
      type,
    });

    const result = await this.holidayRepository.create(holiday);

    this.logger.debug('Holiday created.', { result });

    return result;
  }
}
