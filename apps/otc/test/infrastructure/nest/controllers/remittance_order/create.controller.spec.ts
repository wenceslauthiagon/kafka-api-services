import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ProviderRepository,
  RemittanceOrderEntity,
  RemittanceOrderRepository,
  RemittanceOrderSide,
  RemittanceOrderType,
  SystemRepository,
} from '@zro/otc/domain';
import {
  CreateRemittanceOrderMicroserviceController as Controller,
  OperationServiceKafka,
  RemittanceOrderDatabaseRepository,
} from '@zro/otc/infrastructure';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  CreateRemittanceOrderRequest,
  RemittanceOrderEventEmitterControllerInterface,
} from '@zro/otc/interface';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { RemittanceOrderFactory } from '@zro/test/otc/config';
import { faker } from '@faker-js/faker/locale/pt_BR';

describe('CreateRemittanceOrderMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let remittanceOrderRepository: RemittanceOrderRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  const remittanceOrderEventEmitter: RemittanceOrderEventEmitterControllerInterface =
    createMock<RemittanceOrderEventEmitterControllerInterface>();
  const mockEmitCreatedRemittanceOrderEvent: jest.Mock = On(
    remittanceOrderEventEmitter,
  ).get(method((mock) => mock.emitRemittanceOrderEvent));

  const systemRepository: SystemRepository = createMock<SystemRepository>();
  const mockGetByIdSystemRepository: jest.Mock = On(systemRepository).get(
    method((mock) => mock.getById),
  );
  const providerRepository: ProviderRepository =
    createMock<ProviderRepository>();
  const mockGetByIdProviderRepository: jest.Mock = On(providerRepository).get(
    method((mock) => mock.getById),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetCurrencyById: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyById),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    remittanceOrderRepository = new RemittanceOrderDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('Create remittance order', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should throw InvalidDataFormatException if missing params.', async () => {
        const message: CreateRemittanceOrderRequest = {
          id: null,
          amount: null,
          currencyId: null,
          providerId: null,
          side: null,
          systemId: null,
          type: null,
        };

        const test = () =>
          controller.execute(
            remittanceOrderRepository,
            operationService,
            systemRepository,
            providerRepository,
            remittanceOrderEventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitCreatedRemittanceOrderEvent).toHaveBeenCalledTimes(0);
        expect(mockGetByIdSystemRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdProviderRepository).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should create a new remittance order successfully.', async () => {
        const remittanceOrder =
          await RemittanceOrderFactory.create<RemittanceOrderEntity>(
            RemittanceOrderEntity.name,
          );

        mockGetByIdSystemRepository.mockResolvedValue(remittanceOrder.system);
        mockGetCurrencyById.mockResolvedValue(remittanceOrder.currency);
        mockGetByIdProviderRepository.mockResolvedValue(
          remittanceOrder.provider,
        );

        const message: CreateRemittanceOrderRequest = {
          id: remittanceOrder.id,
          amount: faker.datatype.number({ min: 1, max: 999999 }),
          currencyId: remittanceOrder.currency.id,
          providerId: remittanceOrder.provider.id,
          systemId: remittanceOrder.system.id,
          side: RemittanceOrderSide.BUY,
          type: RemittanceOrderType.EFX,
        };

        const result = await controller.execute(
          remittanceOrderRepository,
          operationService,
          systemRepository,
          providerRepository,
          remittanceOrderEventEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(message.id);
        expect(mockGetByIdSystemRepository).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyById).toHaveBeenCalledTimes(1);
        expect(mockGetByIdProviderRepository).toHaveBeenCalledTimes(1);
        expect(mockEmitCreatedRemittanceOrderEvent).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
