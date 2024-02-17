import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  BotOtcNotFoundException,
  UpdateBotOtcUseCase as UseCase,
} from '@zro/otc-bot/application';
import {
  BotOtcControl,
  BotOtcEntity,
  BotOtcRepository,
} from '@zro/otc-bot/domain';
import { BotOtcFactory } from '@zro/test/otc-bot/config';

describe('UpdateBotOtc', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const botOtcRepository: BotOtcRepository = createMock<BotOtcRepository>();
    const mockGetByIdBotOtcRepository: jest.Mock = On(botOtcRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateBotOtcRepository: jest.Mock = On(botOtcRepository).get(
      method((mock) => mock.update),
    );

    const sut = new UseCase(logger, botOtcRepository);
    return {
      sut,
      mockGetByIdBotOtcRepository,
      mockUpdateBotOtcRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update botOtc if missing params', async () => {
      const { sut, mockGetByIdBotOtcRepository, mockUpdateBotOtcRepository } =
        makeSut();

      const botsOtc = [];

      const botOtcWithouId = await BotOtcFactory.create<BotOtcEntity>(
        BotOtcEntity.name,
        {
          id: null,
        },
      );

      const botOtcWithoutParams = await BotOtcFactory.create<BotOtcEntity>(
        BotOtcEntity.name,
        {
          balance: null,
          spread: null,
          control: null,
          step: null,
        },
      );

      botsOtc.push(botOtcWithouId, botOtcWithoutParams);

      for (const bot of botsOtc) {
        const test = () => sut.execute(bot);

        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByIdBotOtcRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateBotOtcRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should throw BotOtcNotFoundException if botOtc not found', async () => {
      const { sut, mockGetByIdBotOtcRepository, mockUpdateBotOtcRepository } =
        makeSut();

      const botOtc = await BotOtcFactory.create<BotOtcEntity>(
        BotOtcEntity.name,
      );

      mockGetByIdBotOtcRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(botOtc);
      await expect(testScript).rejects.toThrow(BotOtcNotFoundException);

      expect(mockGetByIdBotOtcRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtcRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should find botOtc and update', async () => {
      const { sut, mockGetByIdBotOtcRepository, mockUpdateBotOtcRepository } =
        makeSut();

      const botsOtc = [];

      const botOtcControlStart = await BotOtcFactory.create<BotOtcEntity>(
        BotOtcEntity.name,
        {
          control: BotOtcControl.START,
        },
      );

      const botOtcControlStop = await BotOtcFactory.create<BotOtcEntity>(
        BotOtcEntity.name,
        {
          control: BotOtcControl.STOP,
        },
      );

      botsOtc.push(botOtcControlStart, botOtcControlStop);

      for (const bot of botsOtc) {
        mockGetByIdBotOtcRepository.mockResolvedValue(bot);

        const testScript = await sut.execute(bot);
        expect(testScript).toBeDefined;
      }

      expect(mockGetByIdBotOtcRepository).toHaveBeenCalledTimes(2);
      expect(mockUpdateBotOtcRepository).toHaveBeenCalledTimes(2);
    });
  });
});
