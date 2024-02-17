import { GetBotOtcOrderByIdUseCase as UseCase } from '@zro/otc-bot/application';
import { BotOtcOrderEntity, BotOtcOrderRepository } from '@zro/otc-bot/domain';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BotOtcOrderFactory } from '@zro/test/otc-bot/config';

describe('GetBotOtcOrderByIdUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRepository = () => {
    const botOtcOrderRepository: BotOtcOrderRepository =
      createMock<BotOtcOrderRepository>();
    const mockGetById: jest.Mock = On(botOtcOrderRepository).get(
      method((mock) => mock.getById),
    );

    return {
      botOtcOrderRepository,
      mockGetById,
    };
  };

  const makeSut = () => {
    const { botOtcOrderRepository, mockGetById } = mockRepository();

    const sut = new UseCase(logger, botOtcOrderRepository);

    return {
      sut,
      mockGetById,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get bot otc order by id successfully.', async () => {
      const { sut, mockGetById } = makeSut();

      const botOtcOrder = await BotOtcOrderFactory.create<BotOtcOrderEntity>(
        BotOtcOrderEntity.name,
      );

      mockGetById.mockResolvedValueOnce(botOtcOrder);

      const result = await sut.execute(botOtcOrder.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(botOtcOrder);
      expect(mockGetById).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw missing data exception if missing params', async () => {
      const { sut, mockGetById } = makeSut();

      await expect(() => sut.execute(null)).rejects.toThrow(
        MissingDataException,
      );
      expect(mockGetById).toHaveBeenCalledTimes(0);
    });
  });
});
