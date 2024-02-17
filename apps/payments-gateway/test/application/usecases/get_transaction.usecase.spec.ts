import axios from 'axios';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  TransactionCurrentPageEntity,
  TransactionCurrentPageRepository,
  TransactionRepository,
} from '@zro/payments-gateway/domain';
import { GetTransactionUseCase as UseCase } from '@zro/payments-gateway/application';
import * as MockGetTransaction from '@zro/test/payments-gateway/config/mocks/get_transactions.mock';
import { TransactionCurrentPageFactory } from '@zro/test/payments-gateway/config';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('GetTransactionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      transactionRepository,
      transactionCurrentPageRepository,
      mockCreateTransaction,
      mockGetTransactionCurrentPage,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      transactionRepository,
      transactionCurrentPageRepository,
      mockAxios,
    );
    return {
      sut,
      mockCreateTransaction,
      mockGetTransactionCurrentPage,
    };
  };

  const mockRepository = () => {
    const transactionRepository: TransactionRepository =
      createMock<TransactionRepository>();
    const mockCreateTransaction: jest.Mock = On(transactionRepository).get(
      method((mock) => mock.create),
    );

    const transactionCurrentPageRepository: TransactionCurrentPageRepository =
      createMock<TransactionCurrentPageRepository>();
    const mockGetTransactionCurrentPage: jest.Mock = On(
      transactionCurrentPageRepository,
    ).get(method((mock) => mock.getCurrentPage));

    return {
      transactionRepository,
      mockCreateTransaction,
      transactionCurrentPageRepository,
      mockGetTransactionCurrentPage,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get transactions when there is current page alread saved', async () => {
      const { sut, mockCreateTransaction, mockGetTransactionCurrentPage } =
        makeSut();

      const transactionCurrentPage =
        await TransactionCurrentPageFactory.create<TransactionCurrentPageEntity>(
          TransactionCurrentPageEntity.name,
        );

      mockAxios.get.mockImplementationOnce(MockGetTransaction.success);
      mockGetTransactionCurrentPage.mockResolvedValue(transactionCurrentPage);

      const result = await sut.execute();

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.page).toBe(1);
        expect(res.size).toBe(15);
        expect(res.transactions.length).toBe(15);
      });
      expect(mockCreateTransaction).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionCurrentPage).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should get transactions when not exists current page already saved', async () => {
      const { sut, mockCreateTransaction, mockGetTransactionCurrentPage } =
        makeSut();

      mockAxios.get.mockImplementationOnce(MockGetTransaction.success);
      mockGetTransactionCurrentPage.mockResolvedValue(undefined);

      const result = await sut.execute();

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.page).toBe(1);
        expect(res.size).toBe(15);
        expect(res.transactions.length).toBe(15);
      });
      expect(mockCreateTransaction).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionCurrentPage).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should get transactions when there is at least one page saved but not exists new pages', async () => {
      const { sut, mockCreateTransaction, mockGetTransactionCurrentPage } =
        makeSut();

      const transactionCurrentPage =
        await TransactionCurrentPageFactory.create<TransactionCurrentPageEntity>(
          TransactionCurrentPageEntity.name,
        );

      mockAxios.get.mockImplementationOnce(
        MockGetTransaction.successWithoutData,
      );
      mockGetTransactionCurrentPage.mockResolvedValue(transactionCurrentPage);

      const result = await sut.execute();

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.page).toBe(1);
        expect(res.size).toBe(1);
        expect(res.transactions.length).toBe(1);
      });
      expect(mockCreateTransaction).toHaveBeenCalledTimes(0);
      expect(mockGetTransactionCurrentPage).toHaveBeenCalledTimes(1);
    });
  });
});
