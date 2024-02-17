import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { City, CityRepository } from '@zro/banking/domain';
import { CityModel } from '@zro/banking/infrastructure';

export class CityDatabaseRepository
  extends DatabaseRepository
  implements CityRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(cityModel: CityModel): City {
    return cityModel?.toDomain() ?? null;
  }

  async create(city: City): Promise<City> {
    const createdCity = await CityModel.create<CityModel>(city, {
      transaction: this.transaction,
    });

    city.active = createdCity.active;
    city.createdAt = createdCity.createdAt;

    return city;
  }

  async update(city: City): Promise<City> {
    await CityModel.update<CityModel>(city, {
      where: { id: city.id },
      transaction: this.transaction,
    });

    return city;
  }

  async delete(city: City): Promise<number> {
    return CityModel.destroy<CityModel>({
      where: { id: city.id },
      transaction: this.transaction,
    });
  }

  async getAll(): Promise<City[]> {
    return CityModel.findAll<CityModel>({
      transaction: this.transaction,
    }).then((res) => res.map(CityDatabaseRepository.toDomain));
  }

  async getByNameAndfederativeUnitAcronym(
    name: string,
    federativeUnitAcronym: string,
  ): Promise<City> {
    return CityModel.findOne<CityModel>({
      where: {
        name,
        federativeUnitAcronym,
      },
      transaction: this.transaction,
    }).then(CityDatabaseRepository.toDomain);
  }

  async getById(id: string): Promise<City> {
    return CityModel.findOne<CityModel>({
      where: { id },
      transaction: this.transaction,
    }).then(CityDatabaseRepository.toDomain);
  }

  async getByCode(code: string): Promise<City> {
    return CityModel.findOne<CityModel>({
      where: { code },
      transaction: this.transaction,
    }).then(CityDatabaseRepository.toDomain);
  }
}
