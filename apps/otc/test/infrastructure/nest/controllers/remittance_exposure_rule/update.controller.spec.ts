import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  RemittanceExposureRuleEntity,
  RemittanceExposureRuleRepository,
} from '@zro/otc/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import { RemittanceExposureRuleNotFoundException } from '@zro/otc/application';
import {
  UpdateRemittanceExposureRuleMicroserviceController as Controller,
  OperationServiceKafka,
  RemittanceExposureRuleDatabaseRepository,
  RemittanceExposureRuleModel,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  UpdateRemittanceExposureRuleRequest,
  RemittanceExposureRuleEventEmitterControllerInterface,
} from '@zro/otc/interface';
import { RemittanceExposureRuleFactory } from '@zro/test/otc/config';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('UpdateRemittanceExposureRuleMicroserviceController', () => {
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

  describe('Update remittance exposure rule.', () => {
    describe('With invalid parameters.', () => {
      it('TC0001 - Should throw InvalidDataFormatException if missing params.', async () => {
        const message: UpdateRemittanceExposureRuleRequest = {
          id: null,
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

      it('TC0002 - Should throw RemittanceExposureRuleNotFoundException if remittance exposure rule do not exist.', async () => {
        const remittanceExposureRule =
          await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
            RemittanceExposureRuleEntity.name,
          );

        mockGetCurrencyBySymbol.mockResolvedValue(
          remittanceExposureRule.currency,
        );

        const message: UpdateRemittanceExposureRuleRequest = {
          id: remittanceExposureRule.id,
          currencySymbol: remittanceExposureRule.currency.symbol,
          amount: faker.datatype.number({ min: 1, max: 999999 }),
          seconds: faker.datatype.number({ min: 1, max: 999999 }),
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

        await expect(testScript).rejects.toThrow(
          RemittanceExposureRuleNotFoundException,
        );
        expect(
          mockEmitCreatedRemittanceExposureRuleEvent,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0003 - Should update a remittance exposure rule with same currency successfully.', async () => {
        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );

        const { id } =
          await RemittanceExposureRuleFactory.create<RemittanceExposureRuleModel>(
            RemittanceExposureRuleModel.name,
            { currencyId: currency.id, currencySymbol: currency.symbol },
          );

        mockGetCurrencyBySymbol.mockResolvedValue(currency);

        const message: UpdateRemittanceExposureRuleRequest = {
          id,
          currencySymbol: currency.symbol,
          amount: faker.datatype.number({ min: 1, max: 999999 }),
          seconds: faker.datatype.number({ min: 1, max: 999999 }),
        };

        const test = await controller.execute(
          remittanceExposureRuleRepository,
          operationService,
          remittanceExposureRuleEmitter,
          logger,
          message,
          ctx,
        );

        expect(test).toBeDefined();
        expect(test.value.amount).toBe(message.amount);
        expect(test.value.seconds).toBe(message.seconds);
        expect(
          mockEmitCreatedRemittanceExposureRuleEvent,
        ).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      });

      it('TC0004 - Should update a remittance exposure rule without new currency successfully.', async () => {
        const { id } =
          await RemittanceExposureRuleFactory.create<RemittanceExposureRuleModel>(
            RemittanceExposureRuleModel.name,
          );

        const message: UpdateRemittanceExposureRuleRequest = {
          id,
          amount: faker.datatype.number({ min: 1, max: 999999 }),
          seconds: faker.datatype.number({ min: 1, max: 999999 }),
        };

        const test = await controller.execute(
          remittanceExposureRuleRepository,
          operationService,
          remittanceExposureRuleEmitter,
          logger,
          message,
          ctx,
        );

        expect(test).toBeDefined();
        expect(test.value.amount).toBe(message.amount);
        expect(test.value.seconds).toBe(message.seconds);
        expect(
          mockEmitCreatedRemittanceExposureRuleEvent,
        ).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - Should update a remittance exposure rule with new currency successfully.', async () => {
        const { id } =
          await RemittanceExposureRuleFactory.create<RemittanceExposureRuleModel>(
            RemittanceExposureRuleModel.name,
          );
        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );
        mockGetCurrencyBySymbol.mockResolvedValue(currency);

        const message: UpdateRemittanceExposureRuleRequest = {
          id,
          currencySymbol: currency.symbol,
          amount: faker.datatype.number({ min: 1, max: 999999 }),
          seconds: faker.datatype.number({ min: 1, max: 999999 }),
        };

        const test = await controller.execute(
          remittanceExposureRuleRepository,
          operationService,
          remittanceExposureRuleEmitter,
          logger,
          message,
          ctx,
        );

        expect(test).toBeDefined();
        expect(test.value.amount).toBe(message.amount);
        expect(test.value.seconds).toBe(message.seconds);
        expect(test.value.currencySymbol).toBe(message.currencySymbol);
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
