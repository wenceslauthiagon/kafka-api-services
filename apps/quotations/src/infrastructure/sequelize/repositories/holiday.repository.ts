import { Transaction, Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import {
  Holiday,
  HolidayLevel,
  HolidayRepository,
} from '@zro/quotations/domain';
import { HolidayModel } from '@zro/quotations/infrastructure';

export class HolidayDatabaseRepository
  extends DatabaseRepository
  implements HolidayRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(model: HolidayModel): Holiday {
    return model?.toDomain() ?? null;
  }

  async create(holiday: Holiday): Promise<Holiday> {
    const createdHoliday = await HolidayModel.create<HolidayModel>(holiday, {
      transaction: this.transaction,
    });

    holiday.id = createdHoliday.id;
    holiday.createdAt = createdHoliday.createdAt;

    return holiday;
  }

  async update(holiday: Holiday): Promise<Holiday> {
    await HolidayModel.update<HolidayModel>(holiday, {
      where: { id: holiday.id },
      transaction: this.transaction,
    });

    return holiday;
  }

  async getById(id: string): Promise<Holiday> {
    return HolidayModel.findOne<HolidayModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(HolidayDatabaseRepository.toDomain);
  }

  async getByDate(date: Date, level = HolidayLevel.NATIONAL): Promise<Holiday> {
    return HolidayModel.findOne<HolidayModel>({
      where: {
        level,
        startDate: { [Op.lte]: date },
        endDate: { [Op.gte]: date },
      },
      transaction: this.transaction,
    }).then(HolidayDatabaseRepository.toDomain);
  }

  async getAll(pagination: Pagination): Promise<TPaginationResponse<Holiday>> {
    return HolidayModel.findAndCountAll<HolidayModel>({
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(HolidayDatabaseRepository.toDomain),
      ),
    );
  }

  async getByDateAndLevels(
    date: Date,
    levels: HolidayLevel[],
  ): Promise<Holiday> {
    return HolidayModel.findOne<HolidayModel>({
      where: {
        level: {
          [Op.or]: levels,
        },
        startDate: { [Op.lte]: date },
        endDate: { [Op.gte]: date },
      },
      transaction: this.transaction,
    }).then(HolidayDatabaseRepository.toDomain);
  }
}
