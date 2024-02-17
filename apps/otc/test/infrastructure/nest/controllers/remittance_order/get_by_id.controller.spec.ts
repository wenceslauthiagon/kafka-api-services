import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  GetRemittanceOrderByIdMicroserviceController as Controller,
  RemittanceOrderModel,
  RemittanceOrderRemittanceDatabaseRepository,
  RemittanceOrderDatabaseRepository,
  RemittanceOrderRemittanceModel,
} from '@zro/otc/infrastructure';
import { GetRemittanceOrderByIdRequest } from '@zro/otc/interface';
import {
  RemittanceOrderRemittanceRepository,
  RemittanceOrderType,
} from '@zro/otc/domain';
import { KafkaContext } from '@nestjs/microservices';
import {
  RemittanceOrderFactory,
  RemittanceOrderRemittanceFactory,
} from '@zro/test/otc/config';

describe('GetRemittanceOrderByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository;
  let remittanceOrderRepository: RemittanceOrderDatabaseRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);

    remittanceOrderRemittanceRepository =
      new RemittanceOrderRemittanceDatabaseRepository();

    remittanceOrderRepository = new RemittanceOrderDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('Get remittance order by id.', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get all remittance orders with pagination and filter successfully.', async () => {
        const remittanceOrder =
          await RemittanceOrderFactory.create<RemittanceOrderModel>(
            RemittanceOrderModel.name,
            {
              type: RemittanceOrderType.EFX,
            },
          );

        await RemittanceOrderRemittanceFactory.create<RemittanceOrderRemittanceModel>(
          RemittanceOrderRemittanceModel.name,
          {
            remittanceOrderId: remittanceOrder.id,
          },
        );

        const message: GetRemittanceOrderByIdRequest = {
          id: remittanceOrder.id,
        };

        const result = await controller.execute(
          remittanceOrderRepository,
          remittanceOrderRemittanceRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.amount).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
        expect(result.value.currency).toBeDefined();
        expect(result.value.id).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
