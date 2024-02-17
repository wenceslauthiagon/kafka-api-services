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
  FilledCryptoRemittanceNestObserver as Observer,
  RemittanceOrderDatabaseRepository,
  SystemDatabaseRepository,
  SystemModel,
} from '@zro/otc/infrastructure';
import {
  RemittanceOrderEventEmitterControllerInterface,
  RemittanceOrderEventType,
  HandleFilledCryptoRemittanceEventRequest,
} from '@zro/otc/interface';
import {
  CryptoRemittanceEntity,
  CryptoRemittanceRepository,
  CryptoRemittanceStatus,
  ProviderEntity,
  RemittanceOrderRepository,
  SystemRepository,
} from '@zro/otc/domain';
import {
  CryptoRemittanceFactory,
  ProviderFactory,
  SystemFactory,
} from '@zro/test/otc/config';

describe('FilledCryptoRemittanceNestObserver', () => {
  let module: TestingModule;
  let observer: Observer;
  let remittanceOrderRepository: RemittanceOrderRepository;
  let systemRepository: SystemRepository;

  const eventEmitter: RemittanceOrderEventEmitterControllerInterface =
    createMock<RemittanceOrderEventEmitterControllerInterface>();
  const mockEmitCreatedRemittanceOrderEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitRemittanceOrderEvent),
  );

  const cryptoRemittanceRepository: CryptoRemittanceRepository =
    createMock<CryptoRemittanceRepository>();
  const mockGetById: jest.Mock = On(cryptoRemittanceRepository).get(
    method((mock) => mock.getById),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    observer = module.get<Observer>(Observer);

    remittanceOrderRepository = new RemittanceOrderDatabaseRepository();
    systemRepository = new SystemDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw InvalidDataFormatException if missing params.', async () => {
      const message: HandleFilledCryptoRemittanceEventRequest = {
        id: null,
        systemName: null,
      };

      const testScript = () =>
        observer.execute(
          message,
          cryptoRemittanceRepository,
          remittanceOrderRepository,
          systemRepository,
          eventEmitter,
          logger,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitCreatedRemittanceOrderEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should create a new remittance order successfully.', async () => {
      const provider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
      );

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
          CryptoRemittanceEntity.name,
          {
            status: CryptoRemittanceStatus.FILLED,
            provider,
            executedAmount: faker.datatype.number({ min: 1, max: 99999 }),
          },
        );

      const system = await SystemFactory.create<SystemModel>(SystemModel.name);

      const message: HandleFilledCryptoRemittanceEventRequest = {
        id: cryptoRemittance.id,
        systemName: system.name,
      };

      mockGetById.mockResolvedValue(cryptoRemittance);

      await observer.execute(
        message,
        cryptoRemittanceRepository,
        remittanceOrderRepository,
        systemRepository,
        eventEmitter,
        logger,
      );

      expect(mockEmitCreatedRemittanceOrderEvent.mock.calls[0][0]).toBe(
        RemittanceOrderEventType.CREATED,
      );
      expect(mockEmitCreatedRemittanceOrderEvent).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
