import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, PaginationEntity } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { WalletEntity } from '@zro/operations/domain';
import { PixDevolutionRepository } from '@zro/pix-payments/domain';
import { GetAllPixDevolutionUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixDepositModel,
  PixDevolutionDatabaseRepository,
  PixDevolutionModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  PixDepositFactory,
  PixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('GetAllPixDevolutionUseCase', () => {
  let module: TestingModule;
  let pixDevolutionRepository: PixDevolutionRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixDevolutionRepository = new PixDevolutionDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get pixDevolutions by user successfully', async () => {
      const userId = uuidV4();

      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
      );

      await PixDevolutionFactory.createMany<PixDevolutionModel>(
        PixDevolutionModel.name,
        3,
        { userId, endToEndId: 'end_to_end_id', depositId: deposit.id },
      );

      const usecase = new UseCase(logger, pixDevolutionRepository);

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
        expect(res.deposit.id).toBe(deposit.id);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0002 - Should get pixDevolutions by wallet successfully', async () => {
      const walletId = uuidV4();

      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
      );

      await PixDevolutionFactory.createMany<PixDevolutionModel>(
        PixDevolutionModel.name,
        3,
        { walletId, depositId: deposit.id },
      );

      const usecase = new UseCase(logger, pixDevolutionRepository);

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
        expect(res.deposit.id).toBe(deposit.id);
        expect(res.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
