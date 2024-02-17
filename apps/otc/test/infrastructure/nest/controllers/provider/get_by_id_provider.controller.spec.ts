import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { ProviderRepository } from '@zro/otc/domain';
import {
  ProviderModel,
  GetByIdProviderMicroserviceController as Controller,
  ProviderDatabaseRepository,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ProviderFactory } from '@zro/test/otc/config';
import { ProviderNotFoundException } from '@zro/otc/application';
import { KafkaContext } from '@nestjs/microservices';
import { GetProviderByIdRequest } from '@zro/otc/interface';

describe('GetByIdProviderMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let providerRepository: ProviderRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    providerRepository = new ProviderDatabaseRepository();
  });

  describe('GetByIdProvider', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get provider by id successfully', async () => {
        const provider = await ProviderFactory.create<ProviderModel>(
          ProviderModel.name,
        );

        const message: GetProviderByIdRequest = {
          id: provider.id,
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
        expect(result.value.createdAt.toISOString()).toBe(
          provider.createdAt.toISOString(),
        );
      });

      it('TC0002 - Should not get provider with incorrect id', async () => {
        const id = uuidV4();

        const message: GetProviderByIdRequest = {
          id,
        };

        const testScript = () =>
          controller.execute(providerRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(ProviderNotFoundException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
