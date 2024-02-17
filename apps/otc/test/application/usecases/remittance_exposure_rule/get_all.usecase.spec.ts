import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  PaginationEntity,
} from '@zro/common';
import {
  GetAllRemittanceExposureRuleUseCase as UseCase,
  OperationService,
} from '@zro/otc/application';
import { RemittanceExposureRuleRepository } from '@zro/otc/domain';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyEntity } from '@zro/operations/domain';

describe('GetAllRemittanceExposureRuleUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const remittanceExposureRuleRepository: RemittanceExposureRuleRepository =
      createMock<RemittanceExposureRuleRepository>();
    const mockGetGetAllRemittanceExposureRuleRepository: jest.Mock = On(
      remittanceExposureRuleRepository,
    ).get(method((mock) => mock.getAll));

    return {
      remittanceExposureRuleRepository,
      mockGetGetAllRemittanceExposureRuleRepository,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetCurrencyBySymbol: jest.Mock = On(operationService).get(
      method((mock) => mock.getCurrencyBySymbol),
    );

    return {
      operationService,
      mockGetCurrencyBySymbol,
    };
  };

  const makeSut = () => {
    const {
      remittanceExposureRuleRepository,
      mockGetGetAllRemittanceExposureRuleRepository,
    } = mockRepository();

    const { operationService, mockGetCurrencyBySymbol } = mockService();

    const sut = new UseCase(
      logger,
      remittanceExposureRuleRepository,
      operationService,
    );

    return {
      sut,
      mockGetCurrencyBySymbol,
      mockGetGetAllRemittanceExposureRuleRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockGetCurrencyBySymbol,
        mockGetGetAllRemittanceExposureRuleRepository,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(
        mockGetGetAllRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get all remittance exposure rules with currency filter successfully.', async () => {
      const {
        sut,
        mockGetCurrencyBySymbol,
        mockGetGetAllRemittanceExposureRuleRepository,
      } = makeSut();

      const pagination = new PaginationEntity({});

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      mockGetCurrencyBySymbol.mockResolvedValue(currency);

      const test = await sut.execute(pagination, currency);

      expect(test).toBeDefined();
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(
        mockGetGetAllRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should get all remittance exposure rules without currency filter successfully.', async () => {
      const {
        sut,
        mockGetCurrencyBySymbol,
        mockGetGetAllRemittanceExposureRuleRepository,
      } = makeSut();

      const pagination = new PaginationEntity({});

      const test = await sut.execute(pagination);

      expect(test).toBeDefined();
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(
        mockGetGetAllRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
