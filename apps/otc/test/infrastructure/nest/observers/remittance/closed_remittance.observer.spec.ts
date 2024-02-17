import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  CryptoMarketEntity,
  CryptoOrderRepository,
  CryptoRemittanceRepository,
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRepository,
  RemittanceRepository,
  RemittanceStatus,
  System,
} from '@zro/otc/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  ClosedRemittanceConfig,
  CryptoOrderDatabaseRepository,
  CryptoOrderModel,
  CryptoRemittanceDatabaseRepository,
  CryptoRemittanceModel,
  ClosedRemittanceNestObserver as Observer,
  OtcBotServiceKafka,
  RemittanceDatabaseRepository,
  RemittanceModel,
  RemittanceOrderDatabaseRepository,
  RemittanceOrderModel,
  RemittanceOrderRemittanceDatabaseRepository,
  RemittanceOrderRemittanceModel,
  SystemModel,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { HandleClosedRemittanceEventRequest } from '@zro/otc/interface';
import {
  CryptoMarketFactory,
  CryptoOrderFactory,
  CryptoRemittanceFactory,
  RemittanceFactory,
  RemittanceOrderFactory,
  RemittanceOrderRemittanceFactory,
  SystemFactory,
} from '@zro/test/otc/config';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('ClosedRemittanceNestObserver', () => {
  let module: TestingModule;
  let observer: Observer;
  let remittanceRepository: RemittanceRepository;
  let remittanceOrderRepository: RemittanceOrderRepository;
  let remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository;
  let cryptoRemittanceRepository: CryptoRemittanceRepository;
  let cryptoOrderRepository: CryptoOrderRepository;
  let configService: ConfigService<ClosedRemittanceConfig>;
  let botOtcSystem: System;

  const otcBotService: OtcBotServiceKafka = createMock<OtcBotServiceKafka>();
  const mockUpdateByRemittance: jest.Mock = On(otcBotService).get(
    method((mock) => mock.updateBotOtcOrderByRemittance),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    observer = module.get<Observer>(Observer);
    configService = module.get(ConfigService);

    const systemName = configService.get<string>('APP_BOT_OTC_SYSTEM_NAME');
    botOtcSystem = await SystemModel.findOne({ where: { name: systemName } });
    if (!botOtcSystem) {
      botOtcSystem = await SystemFactory.create<SystemModel>(SystemModel.name, {
        name: systemName,
      });
    }

    remittanceRepository = new RemittanceDatabaseRepository();
    remittanceOrderRepository = new RemittanceOrderDatabaseRepository();
    remittanceOrderRemittanceRepository =
      new RemittanceOrderRemittanceDatabaseRepository();
    cryptoRemittanceRepository = new CryptoRemittanceDatabaseRepository();
    cryptoOrderRepository = new CryptoOrderDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw InvalidDataFormatException if missing params.', async () => {
      const message: HandleClosedRemittanceEventRequest = {
        id: null,
        systemId: null,
      };

      const testScript = () =>
        observer.handleClosedEvent(
          message,
          remittanceRepository,
          remittanceOrderRepository,
          remittanceOrderRemittanceRepository,
          cryptoRemittanceRepository,
          cryptoOrderRepository,
          otcBotService,
          logger,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockUpdateByRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should be undefined if System ID is different of Remittance system ID.', async () => {
      const message: HandleClosedRemittanceEventRequest = {
        id: faker.datatype.uuid(),
        systemId: faker.datatype.uuid(),
      };

      const testScript = await observer.handleClosedEvent(
        message,
        remittanceRepository,
        remittanceOrderRepository,
        remittanceOrderRemittanceRepository,
        cryptoRemittanceRepository,
        cryptoOrderRepository,
        otcBotService,
        logger,
      );

      expect(testScript).toBeUndefined();
      expect(mockUpdateByRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should be Undefined if Remittance not found.', async () => {
      const message: HandleClosedRemittanceEventRequest = {
        id: faker.datatype.uuid(),
        systemId: botOtcSystem.id,
      };

      await observer.onModuleInit();

      const testScript = await observer.handleClosedEvent(
        message,
        remittanceRepository,
        remittanceOrderRepository,
        remittanceOrderRemittanceRepository,
        cryptoRemittanceRepository,
        cryptoOrderRepository,
        otcBotService,
        logger,
      );

      expect(testScript).toBeUndefined();
      expect(mockUpdateByRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should be undefined if Remittance status is different of CLOSED.', async () => {
      const remittance = await RemittanceFactory.create<RemittanceModel>(
        RemittanceModel.name,
        { systemId: botOtcSystem.id },
      );

      const message: HandleClosedRemittanceEventRequest = {
        id: remittance.id,
        systemId: remittance.systemId,
      };

      await observer.onModuleInit();

      const testScript = await observer.handleClosedEvent(
        message,
        remittanceRepository,
        remittanceOrderRepository,
        remittanceOrderRemittanceRepository,
        cryptoRemittanceRepository,
        cryptoOrderRepository,
        otcBotService,
        logger,
      );

      expect(testScript).toBeUndefined();
      expect(mockUpdateByRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should be undefined if Remittance Order Remittances not found.', async () => {
      const remittance = await RemittanceFactory.create<RemittanceModel>(
        RemittanceModel.name,
        { status: RemittanceStatus.CLOSED, systemId: botOtcSystem.id },
      );

      const message: HandleClosedRemittanceEventRequest = {
        id: remittance.id,
        systemId: remittance.systemId,
      };

      await observer.onModuleInit();

      const testScript = await observer.handleClosedEvent(
        message,
        remittanceRepository,
        remittanceOrderRepository,
        remittanceOrderRemittanceRepository,
        cryptoRemittanceRepository,
        cryptoOrderRepository,
        otcBotService,
        logger,
      );
      expect(testScript).toBeUndefined();
      expect(mockUpdateByRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should be undefined if Remittance Order not found.', async () => {
      const remittance = await RemittanceFactory.create<RemittanceModel>(
        RemittanceModel.name,
        { status: RemittanceStatus.CLOSED, systemId: botOtcSystem.id },
      );

      await RemittanceOrderRemittanceFactory.createMany<RemittanceOrderRemittanceModel>(
        RemittanceOrderRemittanceModel.name,
        1,
        { remittanceId: remittance.id },
      );

      const message: HandleClosedRemittanceEventRequest = {
        id: remittance.id,
        systemId: remittance.systemId,
      };

      await observer.onModuleInit();

      const testScript = await observer.handleClosedEvent(
        message,
        remittanceRepository,
        remittanceOrderRepository,
        remittanceOrderRemittanceRepository,
        cryptoRemittanceRepository,
        cryptoOrderRepository,
        otcBotService,
        logger,
      );

      expect(testScript).toBeUndefined();
      expect(mockUpdateByRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should be undefined if Crypto Remittance not found.', async () => {
      const remittance = await RemittanceFactory.create<RemittanceModel>(
        RemittanceModel.name,
        { status: RemittanceStatus.CLOSED, systemId: botOtcSystem.id },
      );

      const remittanceOrder =
        await RemittanceOrderFactory.create<RemittanceOrderModel>(
          RemittanceOrderModel.name,
        );

      await RemittanceOrderRemittanceFactory.createMany<RemittanceOrderRemittanceModel>(
        RemittanceOrderRemittanceModel.name,
        1,
        { remittanceId: remittance.id, remittanceOrderId: remittanceOrder.id },
      );

      const message: HandleClosedRemittanceEventRequest = {
        id: remittance.id,
        systemId: remittance.systemId,
      };

      await observer.onModuleInit();

      const testScript = await observer.handleClosedEvent(
        message,
        remittanceRepository,
        remittanceOrderRepository,
        remittanceOrderRemittanceRepository,
        cryptoRemittanceRepository,
        cryptoOrderRepository,
        otcBotService,
        logger,
      );

      expect(testScript).toBeUndefined();
      expect(mockUpdateByRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should be undefined if Crypto Orders not found.', async () => {
      const remittance = await RemittanceFactory.create<RemittanceModel>(
        RemittanceModel.name,
        { status: RemittanceStatus.CLOSED, systemId: botOtcSystem.id },
      );

      const currency = CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const market = CryptoMarketFactory.create<CryptoMarketEntity>(
        CryptoMarketEntity.name,
      );

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceModel>(
          CryptoRemittanceModel.name,
          {
            baseCurrency: currency,
            quoteCurrency: currency,
            market,
          },
        );

      const remittanceOrder =
        await RemittanceOrderFactory.create<RemittanceOrderModel>(
          RemittanceOrderModel.name,
          {
            cryptoRemittanceId: cryptoRemittance.id,
          },
        );

      await RemittanceOrderRemittanceFactory.createMany<RemittanceOrderRemittanceModel>(
        RemittanceOrderRemittanceModel.name,
        1,
        { remittanceId: remittance.id, remittanceOrderId: remittanceOrder.id },
      );

      const message: HandleClosedRemittanceEventRequest = {
        id: remittance.id,
        systemId: remittance.systemId,
      };

      await observer.onModuleInit();

      const testScript = await observer.handleClosedEvent(
        message,
        remittanceRepository,
        remittanceOrderRepository,
        remittanceOrderRemittanceRepository,
        cryptoRemittanceRepository,
        cryptoOrderRepository,
        otcBotService,
        logger,
      );

      expect(testScript).toBeUndefined();
      expect(mockUpdateByRemittance).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0009 - Should update a Bot Otc Order by remittance successfully.', async () => {
      const remittance = await RemittanceFactory.create<RemittanceModel>(
        RemittanceModel.name,
        { status: RemittanceStatus.CLOSED, systemId: botOtcSystem.id },
      );

      const currency = CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const market = CryptoMarketFactory.create<CryptoMarketEntity>(
        CryptoMarketEntity.name,
      );

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceModel>(
          CryptoRemittanceModel.name,
          {
            baseCurrency: currency,
            quoteCurrency: currency,
            market,
          },
        );

      const remittanceOrder =
        await RemittanceOrderFactory.create<RemittanceOrderModel>(
          RemittanceOrderModel.name,
          {
            cryptoRemittanceId: cryptoRemittance.id,
          },
        );

      await RemittanceOrderRemittanceFactory.createMany<RemittanceOrderRemittanceModel>(
        RemittanceOrderRemittanceModel.name,
        1,
        { remittanceId: remittance.id, remittanceOrderId: remittanceOrder.id },
      );

      await CryptoOrderFactory.createMany<CryptoOrderModel>(
        CryptoOrderModel.name,
        1,
        {
          cryptoRemittanceId: cryptoRemittance.id,
        },
      );

      const message: HandleClosedRemittanceEventRequest = {
        id: remittance.id,
        systemId: remittance.systemId,
      };

      await observer.onModuleInit();

      await observer.handleClosedEvent(
        message,
        remittanceRepository,
        remittanceOrderRepository,
        remittanceOrderRemittanceRepository,
        cryptoRemittanceRepository,
        cryptoOrderRepository,
        otcBotService,
        logger,
      );

      expect(mockUpdateByRemittance).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
