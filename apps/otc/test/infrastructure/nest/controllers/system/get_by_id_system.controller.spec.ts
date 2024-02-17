import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { SystemRepository } from '@zro/otc/domain';
import {
  SystemModel,
  GetSystemByIdMicroserviceController as Controller,
  SystemDatabaseRepository,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { SystemFactory } from '@zro/test/otc/config';
import { SystemNotFoundException } from '@zro/otc/application';
import { KafkaContext } from '@nestjs/microservices';
import { GetSystemByIdRequest } from '@zro/otc/interface';

describe('GetSystemByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let systemRepository: SystemRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    systemRepository = new SystemDatabaseRepository();
  });

  describe('GetSystemById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get system by id successfully', async () => {
        const system = await SystemFactory.create<SystemModel>(
          SystemModel.name,
        );

        const message: GetSystemByIdRequest = {
          id: system.id,
        };

        const result = await controller.execute(
          systemRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(system.id);
        expect(result.value.name).toBe(system.name);
        expect(result.value.description).toBe(system.description);
        expect(result.value.createdAt.toISOString()).toBe(
          system.createdAt.toISOString(),
        );
      });

      it('TC0002 - Should not get system with incorrect id', async () => {
        const id = uuidV4();

        const message: GetSystemByIdRequest = {
          id,
        };

        const testScript = () =>
          controller.execute(systemRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(SystemNotFoundException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
