import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { ProviderRepository } from '@zro/otc/domain';
import {
  GetByIdProviderUseCase as UseCase,
  ProviderNotFoundException,
} from '@zro/otc/application';
import {
  ProviderDatabaseRepository,
  ProviderModel,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ProviderFactory } from '@zro/test/otc/config';

describe('GetByIdProviderUseCase', () => {
  let module: TestingModule;
  let providerRepository: ProviderRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    providerRepository = new ProviderDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get provider by id successfully', async () => {
      const provider = await ProviderFactory.create<ProviderModel>(
        ProviderModel.name,
      );

      const usecase = new UseCase(logger, providerRepository);

      const result = await usecase.execute(provider.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(provider.id);
    });

    it('TC0002 - Should not get provider with incorrect id', async () => {
      const id = uuidV4();

      const usecase = new UseCase(logger, providerRepository);

      const testScript = () => usecase.execute(id);

      await expect(testScript).rejects.toThrow(ProviderNotFoundException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
