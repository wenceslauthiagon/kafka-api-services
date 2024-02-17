import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Mutex } from 'redis-semaphore';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from '@zro/common';
import { CityEntity } from '@zro/banking/domain';
import { SyncCityRequest } from '@zro/banking/interface';
import {
  CityCronServiceInit as Cron,
  CityModel,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { CityFactory } from '@zro/test/banking/config';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('CityCronServiceInit', () => {
  let module: TestingModule;
  let controller: Cron;

  const kafkaService: KafkaService = createMock<KafkaService>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<Cron>(Cron);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    await CityModel.truncate();
  });

  describe('Sync', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create the city successfully', async () => {
        const city = await CityFactory.create<CityEntity>(CityEntity.name, {
          active: true,
        });
        const newCity: SyncCityRequest = {
          id: city.id,
          code: city.code,
          name: city.name,
          federativeUnitCode: city.federativeUnitCode,
          federativeUnitName: city.federativeUnitName,
          federativeUnitAcronym: city.federativeUnitAcronym,
          regionCode: city.regionCode,
          regionName: city.regionName,
          regionAcronym: city.regionAcronym,
          active: city.active,
        };

        const spyCityDownload = jest.spyOn(controller, 'download');
        spyCityDownload.mockResolvedValue([newCity]);
        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.syncCity();

        const result = await CityModel.findOne({ where: { id: city.id } });
        expect(spyCityDownload).toHaveBeenCalledTimes(1);
        expect(result).toBeDefined();
        expect(result.id).toBe(city.id);
        expect(result.code).toBe(city.code);
        expect(result.name).toBe(newCity.name);
      });

      it('TC0002 - Should execute the city update successfully', async () => {
        const city = await CityFactory.create<CityModel>(CityModel.name, {
          active: true,
        });
        const newCity: SyncCityRequest = {
          id: uuidV4(),
          code: city.code,
          name: uuidV4(),
          federativeUnitCode: city.federativeUnitCode,
          federativeUnitName: city.federativeUnitName,
          federativeUnitAcronym: city.federativeUnitAcronym,
          regionCode: city.regionCode,
          regionName: city.regionName,
          regionAcronym: city.regionAcronym,
          active: city.active,
        };

        const spyCityDownload = jest.spyOn(controller, 'download');
        spyCityDownload.mockResolvedValue([newCity]);
        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.syncCity();

        const result = await CityModel.findOne({ where: { id: city.id } });
        expect(spyCityDownload).toHaveBeenCalledTimes(1);
        expect(result).toBeDefined();
        expect(result.id).toBe(city.id);
        expect(result.code).toBe(city.code);
        expect(result.name).toBe(newCity.name);
      });

      it('TC0003 - Should execute nothing the city created successfully', async () => {
        const city = await CityFactory.create<CityModel>(CityModel.name, {
          active: true,
        });
        const newCity: SyncCityRequest = {
          id: city.id,
          code: city.code,
          name: city.name,
          federativeUnitCode: city.federativeUnitCode,
          federativeUnitName: city.federativeUnitName,
          federativeUnitAcronym: city.federativeUnitAcronym,
          regionCode: city.regionCode,
          regionName: city.regionName,
          regionAcronym: city.regionAcronym,
          active: city.active,
        };

        const spyCityDownload = jest.spyOn(controller, 'download');
        spyCityDownload.mockResolvedValue([newCity]);
        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.syncCity();

        const result = await CityModel.findOne({ where: { id: city.id } });
        expect(spyCityDownload).toHaveBeenCalledTimes(1);
        expect(result).toBeDefined();
        expect(result.id).toBe(city.id);
        expect(result.code).toBe(city.code);
        expect(result.name).toBe(city.name);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
