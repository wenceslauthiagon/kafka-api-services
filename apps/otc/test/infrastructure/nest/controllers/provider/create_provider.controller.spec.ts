import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ProviderRepository } from '@zro/otc/domain';
import {
  CreateProviderMicroserviceController,
  ProviderDatabaseRepository,
  ProviderModel,
} from '@zro/otc/infrastructure';
import { ProviderFactory } from '@zro/test/otc/config';
import { CreateProviderRequest } from '@zro/otc/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateProviderMicroserviceController', () => {
  let module: TestingModule;
  let controller: CreateProviderMicroserviceController;
  let providerRepository: ProviderRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<CreateProviderMicroserviceController>(
      CreateProviderMicroserviceController,
    );
    providerRepository = new ProviderDatabaseRepository();
  });

  describe('CreateProvider', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create provider successfully', async () => {
        const id = faker.datatype.uuid();
        const name = faker.datatype.string(10);

        const message: CreateProviderRequest = {
          id,
          name,
        };

        const result = await controller.execute(
          providerRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(id);
        expect(result.value.name).toBe(name);
      });

      it('TC0002 - Should not create a provider with the same ID', async () => {
        const provider = await ProviderFactory.create<ProviderModel>(
          ProviderModel.name,
        );

        const message: CreateProviderRequest = {
          id: provider.id,
          name: provider.name,
        };

        const result = await controller.execute(
          providerRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(provider.id);
        expect(result.value.name).toBe(provider.name);
        expect(result.value.description).toBe(provider.description);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
