import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { LimitTypeRepository } from '@zro/operations/domain';
import {
  GetLimitTypesByFilterMicroserviceController as Controller,
  LimitTypeModel,
  TransactionTypeModel,
  LimitTypeDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  LimitTypeFactory,
  TransactionTypeFactory,
} from '@zro/test/operations/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetLimitTypesByFilterRequest } from '@zro/operations/interface';

describe('GetLimitTypesByFilterMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let limitTypeRepository: LimitTypeRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    limitTypeRepository = new LimitTypeDatabaseRepository();
  });

  describe('GetLimitTypesByFilter', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get limit types filtered by transactionTypeId successfully', async () => {
        const limitTypes = await LimitTypeFactory.createMany<LimitTypeModel>(
          LimitTypeModel.name,
          5,
        );

        const transactionType =
          await TransactionTypeFactory.create<TransactionTypeModel>(
            TransactionTypeModel.name,
            { limitType: limitTypes[0] },
          );

        const message: GetLimitTypesByFilterRequest = {
          transactionTypeTag: transactionType.tag,
        };

        const result = await controller.execute(
          limitTypeRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        expect(result.value.page).toBeDefined();
        expect(result.value.pageSize).toBeDefined();
        expect(result.value.total).toBeDefined();
        expect(result.value.pageTotal).toBeDefined();
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.tag).toBeDefined();
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
