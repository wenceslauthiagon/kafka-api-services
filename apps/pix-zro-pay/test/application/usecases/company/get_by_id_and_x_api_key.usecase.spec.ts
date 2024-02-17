import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { CompanyEntity, CompanyRepository } from '@zro/pix-zro-pay/domain';
import { GetCompanyByIdAndXApiKeyUseCase as UseCase } from '@zro/pix-zro-pay/application';
import { CompanyFactory } from '@zro/test/pix-zro-pay/config';

describe('GetCompanyByIdAndXApiKeyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const { companyRepository, mockGetCompanyRepository } = mockRepository();

    const sut = new UseCase(logger, companyRepository);
    return {
      sut,
      companyRepository,
      mockGetCompanyRepository,
    };
  };

  const mockRepository = () => {
    const companyRepository: CompanyRepository =
      createMock<CompanyRepository>();
    const mockGetCompanyRepository: jest.Mock = On(companyRepository).get(
      method((mock) => mock.getByIdAndXApiKey),
    );

    return {
      companyRepository,
      mockGetCompanyRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get if missing params', async () => {
      const { sut, mockGetCompanyRepository } = makeSut();

      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get company successfully', async () => {
      const { sut, mockGetCompanyRepository } = makeSut();

      const company = await CompanyFactory.create<CompanyEntity>(
        CompanyEntity.name,
      );

      mockGetCompanyRepository.mockResolvedValue(company);

      const result = await sut.execute(company.id, company.xApiKey);

      expect(result).toBeDefined();
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCompanyRepository).toHaveBeenCalledWith(
        company.id,
        company.xApiKey,
      );
    });
  });
});
