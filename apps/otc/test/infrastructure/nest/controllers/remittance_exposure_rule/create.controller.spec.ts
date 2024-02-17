import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  CreateRemittanceExposureRuleMicroserviceController as Controller,
  OperationServiceKafka,
  RemittanceExposureRuleDatabaseRepository,
  RemittanceExposureRuleModel,
} from '@zro/otc/infrastructure';
import {
  CreateRemittanceExposureRuleRequest,
  RemittanceExposureRuleEventEmitterControllerInterface,
} from '@zro/otc/interface';
import {
  RemittanceExposureRuleEntity,
  RemittanceExposureRuleRepository,
} from '@zro/otc/domain';
import { RemittanceExposureRuleFactory } from '@zro/test/otc/config';
import { KafkaContext } from '@nestjs/microservices';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyEntity } from '@zro/operations/domain';

describe('CreateRemittanceExposureRuleMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let remittanceExposureRuleRepository: RemittanceExposureRuleRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  const remittanceExposureRuleEmitter: RemittanceExposureRuleEventEmitterControllerInterface =
    createMock<RemittanceExposureRuleEventEmitterControllerInterface>();
  const mockEmitCreatedRemittanceExposureRuleEvent: jest.Mock = On(
    remittanceExposureRuleEmitter,
  ).get(method((mock) => mock.emitRemittanceExposureRuleEvent));

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

  describe('Create remittance exposure rule.', () => {
    describe('With invalid parameters.', () => {
      it('TC0001 - Should throw InvalidDataFormatException if missing params.', async () => {
        const message: CreateRemittanceExposureRuleRequest = {
          id: null,
          currencySymbol: null,
          amount: null,
          seconds: null,
        };

        const testScript = () =>
          controller.execute(
            remittanceExposureRuleRepository,
            operationService,
            remittanceExposureRuleEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(
          mockEmitCreatedRemittanceExposureRuleEvent,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should return existent remittance exposure rule if it already exists.', async () => {
        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );

        const remittanceExposureRule =
          await RemittanceExposureRuleFactory.create<RemittanceExposureRuleModel>(
            RemittanceExposureRuleModel.name,
            {
              currencyId: currency.id,
            },
          );

        const message: CreateRemittanceExposureRuleRequest = {
          id: remittanceExposureRule.id,
          currencySymbol: currency.symbol,
          amount: faker.datatype.number({ min: 1, max: 999999 }),
          seconds: faker.datatype.number({ min: 1, max: 999999 }),
        };

        const result = await controller.execute(
          remittanceExposureRuleRepository,
          operationService,
          remittanceExposureRuleEmitter,
          logger,
          message,
          ctx,
        );

        expect(result.value.id).toBe(remittanceExposureRule.id);
        expect(result.value.amount).toBe(remittanceExposureRule.amount);
        expect(result.value.seconds).toBe(remittanceExposureRule.seconds);
        expect(
          mockEmitCreatedRemittanceExposureRuleEvent,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should create a new remittance exposure rule successfully.', async () => {
        const remittanceExposureRule =
          await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
            RemittanceExposureRuleEntity.name,
          );

        mockGetCurrencyBySymbol.mockResolvedValue(
          remittanceExposureRule.currency,
        );

        const message: CreateRemittanceExposureRuleRequest = {
          id: remittanceExposureRule.id,
          currencySymbol: remittanceExposureRule.currency.symbol,
          amount: faker.datatype.number({ min: 1, max: 999999 }),
          seconds: faker.datatype.number({ min: 1, max: 999999 }),
        };

        const result = await controller.execute(
          remittanceExposureRuleRepository,
          operationService,
          remittanceExposureRuleEmitter,
          logger,
          message,
          ctx,
        );

        expect(result.value).toBeDefined();
        expect(result.value.amount).toBe(message.amount);
        expect(result.value.seconds).toBe(message.seconds);
        expect(result.value.currencySymbol).toBe(message.currencySymbol);
        expect(
          mockEmitCreatedRemittanceExposureRuleEvent,
        ).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
