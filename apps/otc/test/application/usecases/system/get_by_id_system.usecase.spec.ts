import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { SystemRepository } from '@zro/otc/domain';
import {
  GetSystemByIdUseCase as UseCase,
  SystemNotFoundException,
} from '@zro/otc/application';
import { SystemDatabaseRepository, SystemModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { SystemFactory } from '@zro/test/otc/config';

describe('GetSystemByIdUseCase', () => {
  let module: TestingModule;
  let systemRepository: SystemRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    systemRepository = new SystemDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get system by id successfully', async () => {
      const system = await SystemFactory.create<SystemModel>(SystemModel.name);

      const usecase = new UseCase(logger, systemRepository);

      const result = await usecase.execute(system.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(system.toDomain());
    });

    it('TC0002 - Should not get system with incorrect id', async () => {
      const id = uuidV4();

      const usecase = new UseCase(logger, systemRepository);

      const testScript = () => usecase.execute(id);

      await expect(testScript).rejects.toThrow(SystemNotFoundException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
