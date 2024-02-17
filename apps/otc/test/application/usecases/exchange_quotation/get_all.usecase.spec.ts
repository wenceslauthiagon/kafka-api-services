import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  PaginationEntity,
  getMoment,
} from '@zro/common';
import {
  ExchangeQuotationRepository,
  ExchangeQuotationState,
  GetExchangeQuotationFilter,
} from '@zro/otc/domain';
import { GetAllExchangeQuotationUseCase as UseCase } from '@zro/otc/application';

describe('GetAllExchangeQuotationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const exchangeQuotationRepository: ExchangeQuotationRepository =
      createMock<ExchangeQuotationRepository>();
    const mockGetGetAllExchangeQuotationRepository: jest.Mock = On(
      exchangeQuotationRepository,
    ).get(method((mock) => mock.getAll));

    return {
      exchangeQuotationRepository,
      mockGetGetAllExchangeQuotationRepository,
    };
  };

  const makeSut = () => {
    const {
      exchangeQuotationRepository,
      mockGetGetAllExchangeQuotationRepository,
    } = mockRepository();

    const sut = new UseCase(logger, exchangeQuotationRepository);

    return {
      sut,
      mockGetGetAllExchangeQuotationRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const { sut, mockGetGetAllExchangeQuotationRepository } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetGetAllExchangeQuotationRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get all exchange quotations with quotation successfully.', async () => {
      const { sut, mockGetGetAllExchangeQuotationRepository } = makeSut();

      const pagination = new PaginationEntity({});
      const filter: GetExchangeQuotationFilter = {
        quotation: 100,
      };

      const test = await sut.execute(pagination, filter);

      expect(test).toBeDefined();
      expect(test.data).toBeDefined();
      expect(mockGetGetAllExchangeQuotationRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should get all exchange quotations with state successfully.', async () => {
      const { sut, mockGetGetAllExchangeQuotationRepository } = makeSut();

      const pagination = new PaginationEntity({});
      const filter: GetExchangeQuotationFilter = {
        state: ExchangeQuotationState.PENDING,
      };

      const test = await sut.execute(pagination, filter);

      expect(test).toBeDefined();
      expect(test.data).toBeDefined();
      expect(mockGetGetAllExchangeQuotationRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should get all exchange quotations with gatewayName successfully.', async () => {
      const { sut, mockGetGetAllExchangeQuotationRepository } = makeSut();

      const pagination = new PaginationEntity({});
      const filter: GetExchangeQuotationFilter = {
        gatewayName: '100',
      };

      const test = await sut.execute(pagination, filter);

      expect(test).toBeDefined();
      expect(test.data).toBeDefined();
      expect(mockGetGetAllExchangeQuotationRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should get all exchange quotations with solicitationPspId successfully.', async () => {
      const { sut, mockGetGetAllExchangeQuotationRepository } = makeSut();

      const pagination = new PaginationEntity({});
      const filter: GetExchangeQuotationFilter = {
        solicitationPspId: uuidV4(),
      };

      const test = await sut.execute(pagination, filter);

      expect(test).toBeDefined();
      expect(test.data).toBeDefined();
      expect(mockGetGetAllExchangeQuotationRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should get all exchange quotations with start and end date successfully.', async () => {
      const { sut, mockGetGetAllExchangeQuotationRepository } = makeSut();

      const pagination = new PaginationEntity({});
      const filter: GetExchangeQuotationFilter = {
        createdAtStart: getMoment().toDate(),
        createdAtEnd: getMoment().add(6, 'day').toDate(),
      };

      const test = await sut.execute(pagination, filter);

      expect(test).toBeDefined();
      expect(test.data).toBeDefined();
      expect(mockGetGetAllExchangeQuotationRepository).toHaveBeenCalledTimes(1);
    });
  });
});
