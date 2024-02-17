import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { RemittanceFactory } from '@zro/test/otc/config';
import { RemittanceEntity, RemittanceRepository } from '@zro/otc/domain';
import {
  GetRemittanceByIdUseCase as UseCase,
  RemittanceNotFoundException,
} from '@zro/otc/application';

describe('GetRemittanceByIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const remittanceRepository: RemittanceRepository =
      createMock<RemittanceRepository>();
    const mockGetRemittanceByIdRepository: jest.Mock = On(
      remittanceRepository,
    ).get(method((mock) => mock.getById));

    return {
      remittanceRepository,
      mockGetRemittanceByIdRepository,
    };
  };

  const makeSut = () => {
    const { remittanceRepository, mockGetRemittanceByIdRepository } =
      mockRepository();

    const sut = new UseCase(logger, remittanceRepository);

    return {
      sut,
      mockGetRemittanceByIdRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get Remittance successfully.', async () => {
      const { sut, mockGetRemittanceByIdRepository } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
      );

      mockGetRemittanceByIdRepository.mockResolvedValue(remittance);

      const testScript = await sut.execute(remittance.id);

      expect(testScript).toBeDefined();
      expect(testScript.id).toBe(remittance.id);
      expect(mockGetRemittanceByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRemittanceByIdRepository.mock.calls[0][0]).toBe(
        remittance.id,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw MissingDataException if missing param.', async () => {
      const { sut, mockGetRemittanceByIdRepository } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetRemittanceByIdRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw RemittanceNotFoundException when Remittance not found.', async () => {
      const { sut, mockGetRemittanceByIdRepository } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
      );

      mockGetRemittanceByIdRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(remittance.id);

      await expect(testScript).rejects.toThrow(RemittanceNotFoundException);
      expect(mockGetRemittanceByIdRepository).toHaveBeenCalledTimes(1);
    });
  });
});
