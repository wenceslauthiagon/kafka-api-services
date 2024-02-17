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
  RemoveExchangeContractFileUseCase,
} from '@zro/otc/application';
import { ExchangeContractFactory } from '@zro/test/otc/config';

describe('RemoveExchangeContractFileUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      exchangeContractRepository,
      mockGetByFileIdExchangeContractRepository,
      mockUpdateExchangeContractRepository,
    } = mockRepository();

    const sut = new RemoveExchangeContractFileUseCase(
      logger,
      exchangeContractRepository,
    );

    return {
      sut,
      mockGetByFileIdExchangeContractRepository,
      mockUpdateExchangeContractRepository,
    };
  };

  const mockRepository = () => {
    const exchangeContractRepository: ExchangeContractRepository =
      createMock<ExchangeContractRepository>();

    const mockGetByFileIdExchangeContractRepository: jest.Mock = On(
      exchangeContractRepository,
    ).get(method((mock) => mock.getByFileId));
    const mockUpdateExchangeContractRepository: jest.Mock = On(
      exchangeContractRepository,
    ).get(method((mock) => mock.update));

    return {
      exchangeContractRepository,
      mockGetByFileIdExchangeContractRepository,
      mockUpdateExchangeContractRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to remove exchange contract file with invalid file id', async () => {
      const {
        sut,
        mockGetByFileIdExchangeContractRepository,
        mockUpdateExchangeContractRepository,
      } = makeSut();

      const file = new FileEntity({ id: uuidV4() });

      mockGetByFileIdExchangeContractRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(file);

      await expect(testScript).rejects.toThrow(
        ExchangeContractNotFoundException,
      );
      expect(mockGetByFileIdExchangeContractRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockUpdateExchangeContractRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not be able to remove exchange contract file with no data', async () => {
      const {
        sut,
        mockGetByFileIdExchangeContractRepository,
        mockUpdateExchangeContractRepository,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByFileIdExchangeContractRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockUpdateExchangeContractRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should be able to remove exchange contract file successfully', async () => {
      const {
        sut,
        mockGetByFileIdExchangeContractRepository,
        mockUpdateExchangeContractRepository,
      } = makeSut();

      const file = new FileEntity({ id: uuidV4() });

      const exchangeContract =
        await ExchangeContractFactory.create<ExchangeContractEntity>(
          ExchangeContractEntity.name,
          { file: null },
        );

      mockGetByFileIdExchangeContractRepository.mockResolvedValue(
        exchangeContract,
      );
      mockUpdateExchangeContractRepository.mockImplementation((i) => i);

      const result = await sut.execute(file);

      expect(result).toBeDefined();
      expect(result.file.id).toBeNull();
      expect(mockGetByFileIdExchangeContractRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockUpdateExchangeContractRepository).toHaveBeenCalledTimes(1);
    });
  });
});
