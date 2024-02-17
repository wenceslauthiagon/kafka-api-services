import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { HandleFailedCreateAndAcceptExchangeQuotationEventUseCase as UseCase } from '@zro/otc/application';
import { RemittanceEntity, RemittanceRepository } from '@zro/otc/domain';
import { RemittanceFactory } from '@zro/test/otc/config';

describe('HandleFailedCreateAndAcceptExchangeQuotationEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const remittanceRepository: RemittanceRepository =
      createMock<RemittanceRepository>();
    const mockGetRemittanceRepository: jest.Mock = On(remittanceRepository).get(
      method((mock) => mock.getById),
    );

    return {
      remittanceRepository,
      mockGetRemittanceRepository,
    };
  };

  const makeSut = () => {
    const { remittanceRepository, mockGetRemittanceRepository } =
      mockRepository();

    const sut = new UseCase(logger, remittanceRepository);

    return {
      sut,
      mockGetRemittanceRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should return status for remittance when deadLetter successfully.', async () => {
      const { sut, mockGetRemittanceRepository } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
      );

      mockGetRemittanceRepository.mockResolvedValue(remittance);

      await sut.execute([remittance.id], new Date(), new Date(), 'USD');

      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
    });
  });
});
