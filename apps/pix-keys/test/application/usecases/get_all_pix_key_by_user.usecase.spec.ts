import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, PaginationEntity } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { PixKeyRepository } from '@zro/pix-keys/domain';
import { GetAllPixKeyByUserUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('GetAllPixKeyByUserUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get pix keys successfully with user', async () => {
      const { userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
      );

      const usecase = new UseCase(logger, pixKeyRepository);

      const pagination = new PaginationEntity();
      const user = new UserEntity({ uuid: userId });

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

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get pix keys other user', async () => {
      await PixKeyFactory.createMany<PixKeyModel>(PixKeyModel.name, 2);

      const usecase = new UseCase(logger, pixKeyRepository);

      const pagination = new PaginationEntity();
      const user = new UserEntity({ uuid: uuidV4() });

      const result = await usecase.execute(pagination, user);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      expect(result.data).toHaveLength(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
