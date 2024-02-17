import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { CityModel } from '@zro/banking/infrastructure';
import { CityFactory } from '@zro/test/banking/config';

describe('CityModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.banking.env'] }),
        DatabaseModule.forFeature([CityModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be create', async () => {
    const city = await CityFactory.create<CityModel>(CityModel.name);
    expect(city).toBeDefined();
    expect(city.id).toBeDefined();
    expect(city.code).toBeDefined();
    expect(city.name).toBeDefined();
    expect(city.regionName).toBeDefined();
    expect(city.active).toBeDefined();
  });

  afterAll(() => module.close());
});
