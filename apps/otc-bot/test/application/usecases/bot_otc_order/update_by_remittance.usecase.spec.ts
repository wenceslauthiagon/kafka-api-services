import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  UpdateBotOtcOrderByRemittanceUseCase as UseCase,
  BotOtcOrderEventEmitter,
  BotOtcOrderNotFoundException,
  OtcService,
} from '@zro/otc-bot/application';
import { BotOtcOrderEntity, BotOtcOrderRepository } from '@zro/otc-bot/domain';
import { BotOtcOrderFactory } from '@zro/test/otc-bot/config';

import { CryptoOrderFactory, RemittanceFactory } from '@zro/test/otc/config';
import { CryptoOrderEntity, RemittanceEntity } from '@zro/otc/domain';
import { RemittanceNotFoundException } from '@zro/otc/application';

describe('UpdateBotOtcOrderByRemittanceUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const botOtcOrderRepository: BotOtcOrderRepository =
      createMock<BotOtcOrderRepository>();
    const mockGetByBuyCryptoOrder: jest.Mock = On(botOtcOrderRepository).get(
      method((mock) => mock.getByBuyCryptoOrder),
    );
    const mockUpdateBotOtcOrder: jest.Mock = On(botOtcOrderRepository).get(
      method((mock) => mock.update),
    );

    return {
      botOtcOrderRepository,
      mockGetByBuyCryptoOrder,
      mockUpdateBotOtcOrder,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: BotOtcOrderEventEmitter =
      createMock<BotOtcOrderEventEmitter>();
    const mockCompletedWithRemittanceBotOtcOrderEventEmitter: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.completedWithRemittanceBotOtcOrder));

    return {
      eventEmitter,
      mockCompletedWithRemittanceBotOtcOrderEventEmitter,
    };
  };

  const mockService = () => {
    const otcService: OtcService = createMock<OtcService>();
    const mockGetRemittanceByIdOtcService: jest.Mock = On(otcService).get(
      method((mock) => mock.getRemittanceById),
    );

    return {
      otcService,
      mockGetRemittanceByIdOtcService,
    };
  };

  const makeSut = () => {
    const {
      botOtcOrderRepository,
      mockGetByBuyCryptoOrder,
      mockUpdateBotOtcOrder,
    } = mockRepository();

    const { eventEmitter, mockCompletedWithRemittanceBotOtcOrderEventEmitter } =
      mockEmitter();

    const { otcService, mockGetRemittanceByIdOtcService } = mockService();

    const sut = new UseCase(
      logger,
      botOtcOrderRepository,
      eventEmitter,
      otcService,
    );

    return {
      sut,
      mockGetByBuyCryptoOrder,
      mockUpdateBotOtcOrder,
      mockCompletedWithRemittanceBotOtcOrderEventEmitter,
      mockGetRemittanceByIdOtcService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockGetByBuyCryptoOrder,
        mockUpdateBotOtcOrder,
        mockCompletedWithRemittanceBotOtcOrderEventEmitter,
        mockGetRemittanceByIdOtcService,
      } = makeSut();

      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
      );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        {
          bankQuote: faker.datatype.number({ min: 1, max: 999999 }),
        },
      );

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(cryptoOrder, null),
        () => sut.execute(null, remittance),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
        expect(mockGetRemittanceByIdOtcService).toHaveBeenCalledTimes(0);
        expect(mockGetByBuyCryptoOrder).toHaveBeenCalledTimes(0);
        expect(mockUpdateBotOtcOrder).toHaveBeenCalledTimes(0);
        expect(
          mockCompletedWithRemittanceBotOtcOrderEventEmitter,
        ).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should throw RemittanceNotFound if Remittance found.', async () => {
      const {
        sut,
        mockGetByBuyCryptoOrder,
        mockUpdateBotOtcOrder,
        mockCompletedWithRemittanceBotOtcOrderEventEmitter,
        mockGetRemittanceByIdOtcService,
      } = makeSut();

      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
      );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        {
          bankQuote: faker.datatype.number({ min: 1, max: 999999 }),
        },
      );

      mockGetRemittanceByIdOtcService.mockResolvedValue(null);

      const test = () => sut.execute(cryptoOrder, remittance);

      await expect(test).rejects.toThrow(RemittanceNotFoundException);
      expect(mockGetRemittanceByIdOtcService).toHaveBeenCalledTimes(1);
      expect(mockGetByBuyCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockUpdateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(
        mockCompletedWithRemittanceBotOtcOrderEventEmitter,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw BotOtcOrderNotFoundException if Bot Otc order not found.', async () => {
      const {
        sut,
        mockGetByBuyCryptoOrder,
        mockUpdateBotOtcOrder,
        mockCompletedWithRemittanceBotOtcOrderEventEmitter,
        mockGetRemittanceByIdOtcService,
      } = makeSut();

      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
      );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        {
          bankQuote: faker.datatype.number({ min: 1, max: 999999 }),
        },
      );

      mockGetRemittanceByIdOtcService.mockResolvedValue(remittance);

      mockGetByBuyCryptoOrder.mockResolvedValue(null);

      const test = () => sut.execute(cryptoOrder, remittance);

      await expect(test).rejects.toThrow(BotOtcOrderNotFoundException);
      expect(mockGetRemittanceByIdOtcService).toHaveBeenCalledTimes(1);
      expect(mockGetByBuyCryptoOrder).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(
        mockCompletedWithRemittanceBotOtcOrderEventEmitter,
      ).toHaveBeenCalledTimes(0);
    });
  });
  describe('With valid parameters', () => {
    it('TC0004 - Should update Bot Otc Order successfully.', async () => {
      const {
        sut,
        mockGetByBuyCryptoOrder,
        mockUpdateBotOtcOrder,
        mockCompletedWithRemittanceBotOtcOrderEventEmitter,
        mockGetRemittanceByIdOtcService,
      } = makeSut();

      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
      );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        {
          bankQuote: faker.datatype.number({ min: 1, max: 999999 }),
        },
      );

      const botOtcOrder = await BotOtcOrderFactory.create<BotOtcOrderEntity>(
        BotOtcOrderEntity.name,
        {
          buyOrder: cryptoOrder,
        },
      );

      mockGetRemittanceByIdOtcService.mockResolvedValue(remittance);

      mockGetByBuyCryptoOrder.mockResolvedValue(botOtcOrder);

      await sut.execute(cryptoOrder, remittance);
      expect(mockGetRemittanceByIdOtcService).toHaveBeenCalledTimes(1);
      expect(mockGetByBuyCryptoOrder).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtcOrder).toHaveBeenCalledTimes(1);
      expect(
        mockCompletedWithRemittanceBotOtcOrderEventEmitter,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
