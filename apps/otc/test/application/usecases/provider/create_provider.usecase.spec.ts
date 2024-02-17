import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import { ProviderRepository } from '@zro/otc/domain';
import { CreateProviderUseCase as UseCase } from '@zro/otc/application';
import {
  ProviderDatabaseRepository,
  ProviderModel,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ProviderFactory } from '@zro/test/otc/config';

describe('CreateProviderUseCase', () => {
  let module: TestingModule;
  let providerRepository: ProviderRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    providerRepository = new ProviderDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should create provider successfully', async () => {
      const id = faker.datatype.uuid();
      const name = faker.datatype.string(10);

      const usecase = new UseCase(logger, providerRepository);

      const result = await usecase.execute(id, name);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.name).toBe(name);
    });

    it('TC0002 - Should not create a provider with the same ID', async () => {
      const provider = await ProviderFactory.create<ProviderModel>(
        ProviderModel.name,
      );

      const usecase = new UseCase(logger, providerRepository);

      const result = await usecase.execute(provider.id, provider.name);

      expect(result).toBeDefined();
      expect(result.id).toBe(provider.id);
      expect(result.name).toBe(provider.name);
      expect(result.description).toBe(provider.description);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
