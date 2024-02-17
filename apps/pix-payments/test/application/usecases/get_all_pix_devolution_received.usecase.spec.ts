import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, PaginationEntity } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { WalletEntity } from '@zro/operations/domain';
import { PixDevolutionReceivedRepository } from '@zro/pix-payments/domain';
import { GetAllPixDevolutionReceivedUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixDevolutionReceivedDatabaseRepository,
  PixDevolutionReceivedModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixDevolutionReceivedFactory } from '@zro/test/pix-payments/config';

describe('GetAllPixDevolutionReceivedUseCase', () => {
  let module: TestingModule;
  let pixDevolutionReceivedRepository: PixDevolutionReceivedRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixDevolutionReceivedRepository =
      new PixDevolutionReceivedDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get pixDevolutionsReceived by user successfully', async () => {
      const userId = uuidV4();
      await PixDevolutionReceivedFactory.createMany<PixDevolutionReceivedModel>(
        PixDevolutionReceivedModel.name,
        3,
        { userId },
      );

      const usecase = new UseCase(logger, pixDevolutionReceivedRepository);

      const user = new UserEntity({ uuid: userId });
      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, user);

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
        expect(res.id).toBeDefined();
        expect(res.endToEndId).toBeDefined();
        expect(res.user.uuid).toBe(userId);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0002 - Should get pixDevolutionsReceived by wallet successfully', async () => {
      const walletId = uuidV4();
      await PixDevolutionReceivedFactory.createMany<PixDevolutionReceivedModel>(
        PixDevolutionReceivedModel.name,
        3,
        { walletId },
      );

      const usecase = new UseCase(logger, pixDevolutionReceivedRepository);

      const wallet = new WalletEntity({ uuid: walletId });
      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, null, wallet);

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
        expect(res.id).toBeDefined();
        expect(res.endToEndId).toBeDefined();
        expect(res.wallet.uuid).toBe(walletId);
        expect(res.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
