import { createMock } from 'ts-auto-mock';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, PaginationOrder } from '@zro/common';
import { RemittanceRepository } from '@zro/otc/domain';
import {
  GetAllRemittanceMicroserviceController as Controller,
  RemittanceDatabaseRepository,
  RemittanceModel,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  GetAllRemittanceRequest,
  GetAllRemittanceSort,
} from '@zro/otc/interface';
import { RemittanceFactory } from '@zro/test/otc/config';

describe('GetAllRemittanceMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let remittanceRepository: RemittanceRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    remittanceRepository = new RemittanceDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('Get all remittance.', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get all remittance with pagination and filter successfully.', async () => {
        await RemittanceModel.truncate();
        await RemittanceFactory.create<RemittanceModel>(RemittanceModel.name);

        const message: GetAllRemittanceRequest = {
          sort: GetAllRemittanceSort.CREATED_AT,
          page: 1,
          pageSize: faker.datatype.number({ min: 1, max: 99 }),
          order: PaginationOrder.DESC,
        };

        const result = await controller.execute(
          remittanceRepository,
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
          expect(res.amount).toBeDefined();
          expect(res.bankQuote).toBeDefined();
          expect(res.exchangeContractId).toBeDefined();
          expect(res.iof).toBeDefined();
          expect(res.createdAt).toBeDefined();
          expect(res.isConcomitant).toBeDefined();
          expect(res.provider).toBeDefined();
          expect(res.receiveDate).toBeDefined();
          expect(res.sendDate).toBeDefined();
          expect(res.side).toBeDefined();
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
