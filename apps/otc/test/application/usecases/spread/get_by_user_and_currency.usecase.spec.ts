import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { SpreadEntity, SpreadRepository } from '@zro/otc/domain';
import { SpreadFactory } from '@zro/test/otc/config';
import { GetSpreadByUserAndCurrencyUseCase as UseCase } from '@zro/otc/application';
import { SpreadDatabaseRepository, SpreadModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { UserEntity } from '@zro/users/domain';

describe('GetSpreadByUserAndCurrencyUseCase', () => {
  let module: TestingModule;
  let spreadRepository: SpreadRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    spreadRepository = new SpreadDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get spread without user and currency', async () => {
      const usecase = new UseCase(logger, spreadRepository);

      const testScript = () => usecase.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get spread by user and currency successfully', async () => {
      const spread = (
        await SpreadFactory.create<SpreadModel>(SpreadModel.name)
      ).toDomain();

      const usecase = new UseCase(logger, spreadRepository);

      const result = await usecase.execute(spread.user, spread.currency);

      expect(result).toBeDefined();
      expect(result.id).toBe(spread.id);
      expect(result.buy).toBe(spread.buy);
      expect(result.sell).toBe(spread.sell);
      expect(result.currency.id).toBe(spread.currency.id);
      expect(result.user).toMatchObject(spread.user);
      expect(result.offMarketBuy).toBe(spread.offMarketBuy);
      expect(result.offMarketSell).toBe(spread.offMarketSell);
      expect(result.offMarketTimeStart).toBe(spread.offMarketTimeStart);
      expect(result.offMarketTimeEnd).toBe(spread.offMarketTimeEnd);
    });

    it('TC0003 - Should get global spread without user successfully', async () => {
      const user = new UserEntity({ uuid: uuidV4() });
      const globalSpread = (
        await SpreadFactory.create<SpreadModel>(SpreadModel.name, {
          userId: null,
        })
      ).toDomain();

      const usecase = new UseCase(logger, spreadRepository);

      const result = await usecase.execute(user, globalSpread.currency);

      expect(result).toBeDefined();
      expect(result.id).toBe(globalSpread.id);
      expect(result.buy).toBe(globalSpread.buy);
      expect(result.sell).toBe(globalSpread.sell);
      expect(result.user).toBeNull();
      expect(result.offMarketBuy).toBe(globalSpread.offMarketBuy);
      expect(result.offMarketSell).toBe(globalSpread.offMarketSell);
      expect(result.offMarketTimeStart).toBe(globalSpread.offMarketTimeStart);
      expect(result.offMarketTimeEnd).toBe(globalSpread.offMarketTimeEnd);
    });

    it('TC0004 - Should get global spread without currency successfully', async () => {
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
      );

      const usecase = new UseCase(logger, spreadRepository);

      const result = await usecase.execute(spread.user, spread.currency);

      expect(result).toBeNull();
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
