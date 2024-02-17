import axios from 'axios';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  ExchangeContractEntity,
  ExchangeContractRepository,
} from '@zro/otc/domain';
import {
  GenerateExchangeContractWorksheetUseCase,
  ExchangeContractsNotFoundByFilterException,
  StorageService,
} from '@zro/otc/application';
import { ExchangeContractFactory } from '@zro/test/otc/config';

describe('GenerateExchangeContractWorksheetUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const axiosInstance = axios.create({
      baseURL: process.env.APP_STORAGE_BASE_URL,
    });

    const {
      exchangeContractRepository,
      mockGetAllByFilterExchangeContractRepository,
    } = mockRepository();

    const { storageFileService, mockStorageFileService } = mockService();

    const sut = new GenerateExchangeContractWorksheetUseCase(
      logger,
      exchangeContractRepository,
      storageFileService,
      axiosInstance,
    );

    return {
      sut,
      mockGetAllByFilterExchangeContractRepository,
      mockStorageFileService,
    };
  };

  const mockRepository = () => {
    const exchangeContractRepository: ExchangeContractRepository =
      createMock<ExchangeContractRepository>();
    const mockGetAllByFilterExchangeContractRepository: jest.Mock = On(
      exchangeContractRepository,
    ).get(method((mock) => mock.getAllByFilter));

    return {
      exchangeContractRepository,
      mockGetAllByFilterExchangeContractRepository,
    };
  };

  const mockService = () => {
    const storageFileService: StorageService = createMock<StorageService>();
    const mockStorageFileService: jest.Mock = On(storageFileService).get(
      method((mock) => mock.uploadFile),
    );

    return {
      storageFileService,
      mockStorageFileService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to generate exchange contract worksheet with wrong filter passed', async () => {
      const { sut, mockGetAllByFilterExchangeContractRepository } = makeSut();

      const testScript = () => sut.execute({});

      await expect(testScript).rejects.toThrow(
        ExchangeContractsNotFoundByFilterException,
      );
      expect(
        mockGetAllByFilterExchangeContractRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should not be able to generate exchange contract worksheet with no data', async () => {
      const {
        sut,
        mockGetAllByFilterExchangeContractRepository,
        mockStorageFileService,
      } = makeSut();

      const exchangeContract =
        await ExchangeContractFactory.create<ExchangeContractEntity>(
          ExchangeContractEntity.name,
        );

      mockGetAllByFilterExchangeContractRepository.mockResolvedValue(
        exchangeContract,
      );

      const filter = {};

      const testScript = () => sut.execute(filter);

      await expect(testScript).rejects.toThrow(
        ExchangeContractsNotFoundByFilterException,
      );
      expect(
        mockGetAllByFilterExchangeContractRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockStorageFileService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should generate exchange contracts successfully with certain search term', async () => {
      const {
        sut,
        mockGetAllByFilterExchangeContractRepository,
        mockStorageFileService,
      } = makeSut();

      const exchangeContract =
        await ExchangeContractFactory.create<ExchangeContractEntity>(
          ExchangeContractEntity.name,
        );

      mockGetAllByFilterExchangeContractRepository.mockResolvedValue([
        exchangeContract,
      ]);

      const filter = {};

      const result = await sut.execute(filter, exchangeContract.contractNumber);

      expect(result).toBeDefined();
      expect(
        mockGetAllByFilterExchangeContractRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockStorageFileService).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should be able to generate exchange contract worksheet successfully', async () => {
      const {
        sut,
        mockGetAllByFilterExchangeContractRepository,
        mockStorageFileService,
      } = makeSut();

      const exchangeContract =
        await ExchangeContractFactory.create<ExchangeContractEntity>(
          ExchangeContractEntity.name,
        );

      mockGetAllByFilterExchangeContractRepository.mockResolvedValue([
        exchangeContract,
      ]);

      const filter = {
        exchangeContractIds: [exchangeContract.id],
      };

      const result = await sut.execute(filter);

      expect(result).toBeDefined();
      expect(
        mockGetAllByFilterExchangeContractRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockStorageFileService).toHaveBeenCalledTimes(1);
    });
  });
});
