import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { FileEntity } from '@zro/storage/domain';
import {
  ExchangeContractEntity,
  ExchangeContractRepository,
} from '@zro/otc/domain';
import {
  ExchangeContractNotFoundException,
  UploadExchangeContractFileUseCase,
} from '@zro/otc/application';

describe('UploadExchangeContractFileUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      exchangeContractRepository,
      mockGetExchangeContractRepository,
      mockUpdateExchangeContractRepository,
    } = mockRepository();

    const sut = new UploadExchangeContractFileUseCase(
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
    it('TC0001 - Should not be able to upload exchange contract file with invalid id', async () => {
      const {
        sut,
        mockGetExchangeContractRepository,
        mockUpdateExchangeContractRepository,
      } = makeSut();

      const file = new FileEntity({ id: uuidV4() });

      mockGetExchangeContractRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(uuidV4(), file);

      await expect(testScript).rejects.toThrow(
        ExchangeContractNotFoundException,
      );
      expect(mockGetExchangeContractRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateExchangeContractRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not be able to upload exchange contract file with no data', async () => {
      const {
        sut,
        mockGetExchangeContractRepository,
        mockUpdateExchangeContractRepository,
      } = makeSut();

      const testScript = () => sut.execute(uuidV4(), null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetExchangeContractRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateExchangeContractRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should be able to upload exchange contract file successfully', async () => {
      const {
        sut,
        mockGetExchangeContractRepository,
        mockUpdateExchangeContractRepository,
      } = makeSut();

      const file = new FileEntity({ id: uuidV4() });
      const exchangeContract = new ExchangeContractEntity({ id: uuidV4() });

      mockGetExchangeContractRepository.mockResolvedValue(exchangeContract);
      exchangeContract.file = file;
      mockUpdateExchangeContractRepository.mockResolvedValue(exchangeContract);

      const result = await sut.execute(exchangeContract.id, file);

      expect(result).toBeDefined();
      expect(result.id).toBe(exchangeContract.id);
      expect(result.file).toMatchObject(file);
      expect(mockGetExchangeContractRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateExchangeContractRepository).toHaveBeenCalledTimes(1);
    });
  });
});
