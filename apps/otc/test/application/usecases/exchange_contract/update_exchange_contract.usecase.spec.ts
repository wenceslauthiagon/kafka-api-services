import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  ExchangeContractEntity,
  ExchangeContractRepository,
} from '@zro/otc/domain';
import {
  ExchangeContractNotFoundException,
  UpdateExchangeContractUseCase,
} from '@zro/otc/application';
import { ExchangeContractFactory } from '@zro/test/otc/config';

describe('UpdateExchangeContractUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      exchangeContractRepository,
      mockGetExchangeContractRepository,
      mockUpdateExchangeContractRepository,
    } = mockRepository();

    const sut = new UpdateExchangeContractUseCase(
      logger,
      exchangeContractRepository,
    );

    return {
      sut,
      mockGetExchangeContractRepository,
      mockUpdateExchangeContractRepository,
    };
  };

  const mockRepository = () => {
    const exchangeContractRepository: ExchangeContractRepository =
      createMock<ExchangeContractRepository>();

    const mockGetExchangeContractRepository: jest.Mock = On(
      exchangeContractRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdateExchangeContractRepository: jest.Mock = On(
      exchangeContractRepository,
    ).get(method((mock) => mock.update));

    return {
      exchangeContractRepository,
      mockGetExchangeContractRepository,
      mockUpdateExchangeContractRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to update exchange contract with invalid id', async () => {
      const {
        sut,
        mockGetExchangeContractRepository,
        mockUpdateExchangeContractRepository,
      } = makeSut();

      mockGetExchangeContractRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(uuidV4(), {
          contractNumber: '123',
          vetQuote: 234,
        });

      await expect(testScript).rejects.toThrow(
        ExchangeContractNotFoundException,
      );
      expect(mockGetExchangeContractRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateExchangeContractRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not be able to update exchange contract with no data', async () => {
      const {
        sut,
        mockGetExchangeContractRepository,
        mockUpdateExchangeContractRepository,
      } = makeSut();

      const testScript = () =>
        sut.execute(uuidV4(), {
          contractNumber: null,
          vetQuote: null,
        });

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetExchangeContractRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateExchangeContractRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should be able to update exchange contract successfully', async () => {
      const {
        sut,
        mockGetExchangeContractRepository,
        mockUpdateExchangeContractRepository,
      } = makeSut();

      const exchangeContract =
        await ExchangeContractFactory.create<ExchangeContractEntity>(
          ExchangeContractEntity.name,
        );

      mockUpdateExchangeContractRepository.mockResolvedValue(exchangeContract);

      const result = await sut.execute(exchangeContract.id, {
        contractNumber: '123',
        vetQuote: 123,
      });

      expect(result).toBeDefined();
      expect(mockGetExchangeContractRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateExchangeContractRepository).toHaveBeenCalledTimes(1);
    });
  });
});
