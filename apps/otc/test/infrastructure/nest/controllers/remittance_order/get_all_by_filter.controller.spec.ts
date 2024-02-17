import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, PaginationOrder } from '@zro/common';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  GetAllRemittanceOrdersByFilterMicroserviceController as Controller,
  RemittanceOrderDatabaseRepository,
  RemittanceOrderModel,
  RemittanceOrderRemittanceDatabaseRepository,
  RemittanceOrderRemittanceModel,
} from '@zro/otc/infrastructure';
import {
  GetAllRemittanceOrdersByFilterRequest,
  GetAllRemittanceOrdersByFilterRequestSort,
} from '@zro/otc/interface';
import {
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRepository,
  RemittanceOrderSide,
  RemittanceOrderStatus,
  RemittanceOrderType,
} from '@zro/otc/domain';
import { KafkaContext } from '@nestjs/microservices';
import {
  RemittanceOrderFactory,
  RemittanceOrderRemittanceFactory,
} from '@zro/test/otc/config';

describe('GetAllRemittanceOrdersByFilterMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository;
  let remittanceOrderRepository: RemittanceOrderRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);

    remittanceOrderRemittanceRepository =
      new RemittanceOrderRemittanceDatabaseRepository();

    remittanceOrderRepository = new RemittanceOrderDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('Get all remittance orders by filter.', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get all remittance orders with pagination and filter successfully.', async () => {
        const id = faker.datatype.uuid();
        const remittanceOrder =
          RemittanceOrderFactory.create<RemittanceOrderModel>(
            RemittanceOrderModel.name,
            {
              id: faker.datatype.uuid(),
              type: RemittanceOrderType.EFX,
              providerId: id,
              systemId: id,
              currencyId: 3,
            },
          );

        RemittanceOrderRemittanceFactory.create<RemittanceOrderRemittanceModel>(
          RemittanceOrderRemittanceModel.name,
          {
            id: faker.datatype.uuid(),
            remittanceOrder,
          },
        );

        const message: GetAllRemittanceOrdersByFilterRequest = {
          sort: GetAllRemittanceOrdersByFilterRequestSort.CREATED_AT,
          page: 1,
          pageSize: faker.datatype.number({ min: 1, max: 99 }),
          order: PaginationOrder.DESC,
          side: RemittanceOrderSide.BUY,
          amountStart: 1,
          amountEnd: 2000000,
          status: RemittanceOrderStatus.OPEN,
          type: RemittanceOrderType.EFX,
          systemId: id,
          providerId: id,
          currencyId: 3,
        };

        const result = await controller.execute(
          remittanceOrderRemittanceRepository,
          remittanceOrderRepository,
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
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.currency).toBeDefined();
          expect(res.provider).toBeDefined();
          expect(res.remittances).toBeDefined();
          expect(res.amount).toBeDefined();
          expect(res.createdAt).toBeDefined();
          expect(res.updatedAt).toBeDefined();
          expect(res.type).toBeDefined();
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
