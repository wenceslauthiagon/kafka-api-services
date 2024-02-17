import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { SpreadRepository } from '@zro/otc/domain';
import {
  GetSpreadByIdMicroserviceController as Controller,
  SpreadDatabaseRepository,
  SpreadModel,
} from '@zro/otc/infrastructure';
import { SpreadFactory } from '@zro/test/otc/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetSpreadByIdRequest } from '@zro/otc/interface';

describe('GetSpreadByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let spreadRepository: SpreadRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    spreadRepository = new SpreadDatabaseRepository();
  });

  describe('GetSpreadById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get spread successfully', async () => {
        const { id } = await SpreadFactory.create<SpreadModel>(
          SpreadModel.name,
        );

        const message: GetSpreadByIdRequest = {
          id,
        };

        const result = await controller.execute(
          spreadRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(id);
        expect(result.value.sell).toBeDefined();
        expect(result.value.amount).toBeDefined();
        expect(result.value.buy).toBeDefined();
        expect(result.value.currencyId).toBeDefined();
        expect(result.value.currencySymbol).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
