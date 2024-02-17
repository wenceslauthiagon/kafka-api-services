import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MissingDataException,
  PaginationEntity,
  defaultLogger as logger,
  PaginationOrder,
} from '@zro/common';
import { GetAllWalletAccountUseCase as UseCase } from '@zro/operations/application';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  WalletAccountDatabaseRepository,
  WalletAccountModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import {
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { WalletEntity } from '@zro/operations/domain';

describe('GetAllWalletAccountUseCase', () => {
  let module: TestingModule;
  const currencyRepository = new WalletAccountDatabaseRepository();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get walletAccounts without wrong pagination params', async () => {
      const sut = new UseCase(logger, currencyRepository);

      const tests = [
        () => sut.execute(null, null, null),
        () =>
          sut.execute(
            new WalletEntity({ uuid: faker.datatype.uuid() }),
            new PaginationEntity({}),
            null,
          ),
        () =>
          sut.execute(
            new WalletEntity({ uuid: faker.datatype.uuid() }),
            null,
            null,
          ),
        () => sut.execute(null, null, {}),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get walletAccounts successfully', async () => {
      const wallet = await WalletFactory.create<WalletModel>(WalletModel.name);
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountModel>(
          WalletAccountModel.name,
          { walletId: wallet.id, walletUUID: wallet.uuid },
        );

      const pagination = new PaginationEntity();

      const usecase = new UseCase(logger, currencyRepository);

      const result = await usecase.execute(wallet, pagination, {});

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBe(walletAccount.id);
        expect(res.balance).toBe(walletAccount.balance);
        expect(res.pendingAmount).toBe(walletAccount.pendingAmount);
        expect(res.averagePrice).toBe(walletAccount.averagePrice);
        expect(res.currency.id).toBe(walletAccount.currencyId);
        expect(res.currency.symbol).toBeDefined();
        expect(res.currency.title).toBeDefined();
        expect(res.state).toBeDefined();
      });
    });

    it('TC0003 - Should get walletAccounts with different currency symbol', async () => {
      const wallet = await WalletFactory.create<WalletModel>(WalletModel.name);
      await WalletAccountFactory.create<WalletAccountModel>(
        WalletAccountModel.name,
        { walletId: wallet.id, walletUUID: wallet.uuid },
      );

      const pagination = new PaginationEntity();

      const usecase = new UseCase(logger, currencyRepository);

      const result = await usecase.execute(wallet, pagination, {
        currencySymbol: wallet.state,
      });

      expect(result).toBeDefined();
      expect(result.data.length).toBe(0);
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBe(0);
      expect(result.pageTotal).toBe(0);
    });

    it('TC0004 - Should get walletAccounts with different currency symbol', async () => {
      const wallet = await WalletFactory.create<WalletModel>(WalletModel.name);

      const pagination = new PaginationEntity({
        sort: 'currencySymbol',
        order: PaginationOrder.ASC,
      });

      await WalletAccountFactory.createMany<WalletAccountModel>(
        WalletAccountModel.name,
        2,
        { walletId: wallet.id, walletUUID: wallet.uuid },
      );

      const usecase = new UseCase(logger, currencyRepository);

      const result = await usecase.execute(wallet, pagination, {});

      expect(result).toBeDefined();
      expect(result.data.length).toBe(2);
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBe(2);
      expect(result.pageTotal).toBe(1);
    });

    afterAll(async () => {
      jest.restoreAllMocks();
      await module.close();
    });
  });
});
