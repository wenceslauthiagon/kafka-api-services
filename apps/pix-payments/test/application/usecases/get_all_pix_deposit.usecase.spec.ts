import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, PaginationEntity } from '@zro/common';
import { PixDepositRepository } from '@zro/pix-payments/domain';
import { UserEntity } from '@zro/users/domain';
import { GetAllPixDepositUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixDepositDatabaseRepository,
  PixDepositModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

describe('GetAllPixDepositUseCase', () => {
  let module: TestingModule;
  let pixDepositRepository: PixDepositRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixDepositRepository = new PixDepositDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get pixDeposits successfully', async () => {
      const userId = uuidV4();
      await PixDepositFactory.createMany<PixDepositModel>(
        PixDepositModel.name,
        3,
        { userId },
      );

      const usecase = new UseCase(logger, pixDepositRepository);

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
        expect(res.user.uuid).toBe(userId);
        expect(res.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
