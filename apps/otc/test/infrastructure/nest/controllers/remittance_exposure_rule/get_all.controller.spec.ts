import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, PaginationOrder } from '@zro/common';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  GetAllRemittanceExposureRuleMicroserviceController as Controller,
  OperationServiceKafka,
  RemittanceExposureRuleDatabaseRepository,
  RemittanceExposureRuleModel,
} from '@zro/otc/infrastructure';
import {
  GetAllRemittanceExposureRuleRequest,
  GetAllRemittanceExposureRuleRequestSort,
} from '@zro/otc/interface';
import { RemittanceExposureRuleRepository } from '@zro/otc/domain';
import { RemittanceExposureRuleFactory } from '@zro/test/otc/config';
import { KafkaContext } from '@nestjs/microservices';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyEntity } from '@zro/operations/domain';

describe('GetAllRemittanceExposureRuleMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let remittanceExposureRuleRepository: RemittanceExposureRuleRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetCurrencyBySymbol: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyBySymbol),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);

    remittanceExposureRuleRepository =
      new RemittanceExposureRuleDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('Get all remittance exposure rules.', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get all remittance exposure rules with pagination and filter successfully.', async () => {
        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );

        mockGetCurrencyBySymbol.mockResolvedValue(currency);

        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleModel>(
          RemittanceExposureRuleModel.name,
          {
            currencyId: currency.id,
            currencySymbol: currency.symbol,
          },
        );

        const message: GetAllRemittanceExposureRuleRequest = {
          currencySymbol: currency.symbol,
          sort: GetAllRemittanceExposureRuleRequestSort.CURRENCY_SYMBOL,
          page: 1,
          pageSize: faker.datatype.number({ min: 1, max: 99 }),
          order: PaginationOrder.DESC,
        };

        const result = await controller.execute(
          remittanceExposureRuleRepository,
          operationService,
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
          expect(res.currencySymbol).toBeDefined();
          expect(res.amount).toBeDefined();
          expect(res.seconds).toBeDefined();
          expect(res.createdAt).toBeDefined();
          expect(res.updatedAt).toBeDefined();
        });
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
