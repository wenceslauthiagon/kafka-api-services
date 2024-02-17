import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  RemittanceEntity,
  RemittanceRepository,
  RemittanceStatus,
} from '@zro/otc/domain';
import {
  RemittanceNotFoundException,
  ManuallyCloseRemittanceUseCase,
  RemittanceEventEmitter,
} from '@zro/otc/application';
import { RemittanceFactory } from '@zro/test/otc/config';

describe('ManuallyCloseRemittanceUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const remittanceEmitter: RemittanceEventEmitter =
      createMock<RemittanceEventEmitter>();
    const mockManuallyClosedRemittanceEmitter: jest.Mock = On(
      remittanceEmitter,
    ).get(method((mock) => mock.manuallyClosedRemittance));

    return {
      remittanceEmitter,
      mockManuallyClosedRemittanceEmitter,
    };
  };

  const makeSut = () => {
    const {
      remittanceRepository,
      mockGetRemittanceRepository,
      mockUpdateRemittanceRepository,
    } = mockRepository();

    const { remittanceEmitter, mockManuallyClosedRemittanceEmitter } =
      mockEmitter();

    const sut = new ManuallyCloseRemittanceUseCase(
      logger,
      remittanceRepository,
      remittanceEmitter,
    );

    return {
      sut,
      mockGetRemittanceRepository,
      mockUpdateRemittanceRepository,
      mockManuallyClosedRemittanceEmitter,
    };
  };

  const mockRepository = () => {
    const remittanceRepository: RemittanceRepository =
      createMock<RemittanceRepository>();

    const mockGetRemittanceRepository: jest.Mock = On(remittanceRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateRemittanceRepository: jest.Mock = On(
      remittanceRepository,
    ).get(method((mock) => mock.update));

    return {
      remittanceRepository,
      mockGetRemittanceRepository,
      mockUpdateRemittanceRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to manually close remittance with invalid id', async () => {
      const {
        sut,
        mockGetRemittanceRepository,
        mockUpdateRemittanceRepository,
      } = makeSut();

      mockGetRemittanceRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(uuidV4(), 123, 234, RemittanceStatus.CLOSED_MANUALLY);

      await expect(testScript).rejects.toThrow(RemittanceNotFoundException);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not be able to manually close remittance with no data', async () => {
      const {
        sut,
        mockGetRemittanceRepository,
        mockUpdateRemittanceRepository,
      } = makeSut();

      const testScript = () => sut.execute(uuidV4(), null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should be able to manually close remittance successfully', async () => {
      const {
        sut,
        mockGetRemittanceRepository,
        mockUpdateRemittanceRepository,
        mockManuallyClosedRemittanceEmitter,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { bankQuote: faker.datatype.number({ min: 1, max: 9999 }) },
      );

      mockUpdateRemittanceRepository.mockResolvedValue(remittance);

      const result = await sut.execute(
        remittance.id,
        remittance.bankQuote,
        remittance.resultAmount,
        RemittanceStatus.CLOSED_MANUALLY,
      );

      expect(result).toBeDefined();
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockManuallyClosedRemittanceEmitter).toHaveBeenCalledTimes(1);
    });
  });
});
