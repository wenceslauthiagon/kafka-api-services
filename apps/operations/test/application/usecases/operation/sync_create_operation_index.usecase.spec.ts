import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { getMoment, defaultLogger as logger } from '@zro/common';
import {
  OperationsIndexEntity,
  OperationsIndexRepository,
} from '@zro/operations/domain';
import { SyncCreateOperationIndexUseCase as UseCase } from '@zro/operations/application';
import { OperationsIndexFactory } from '@zro/test/operations/config';

const tableName = 'Operations';

describe('SyncCreateOperationIndexUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const operationsIndexRepository: OperationsIndexRepository =
      createMock<OperationsIndexRepository>();
    const mockGetIndexByName: jest.Mock = On(operationsIndexRepository).get(
      method((mock) => mock.getByName),
    );
    const mockCreatePartialIndexByDateRangeOfCreatedAt: jest.Mock = On(
      operationsIndexRepository,
    ).get(method((mock) => mock.createPartialIndexByDateRangeOfCreatedAt));

    return {
      operationsIndexRepository,
      mockGetIndexByName,
      mockCreatePartialIndexByDateRangeOfCreatedAt,
    };
  };

  const makeSut = () => {
    const {
      operationsIndexRepository,
      mockGetIndexByName,
      mockCreatePartialIndexByDateRangeOfCreatedAt,
    } = mockRepository();

    const sut = new UseCase(logger, operationsIndexRepository, tableName);

    return {
      sut,
      mockGetIndexByName,
      mockCreatePartialIndexByDateRangeOfCreatedAt,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should sync create operation index', async () => {
      const {
        sut,
        mockGetIndexByName,
        mockCreatePartialIndexByDateRangeOfCreatedAt,
      } = makeSut();

      const oneMonthAfterCurrentDate = getMoment().add(1, 'month');

      const year = oneMonthAfterCurrentDate.year();
      const month = oneMonthAfterCurrentDate.month();

      const indexName = `Operations_created_at_index_${year}_${month + 1}`;

      const operationsIndex =
        await OperationsIndexFactory.create<OperationsIndexEntity>(
          OperationsIndexEntity.name,
          {
            tableName,
            indexName,
          },
        );

      mockGetIndexByName.mockResolvedValueOnce(null);

      mockCreatePartialIndexByDateRangeOfCreatedAt.mockResolvedValueOnce(
        operationsIndex,
      );

      await sut.execute();

      expect(mockGetIndexByName).toHaveBeenCalledTimes(2);
      expect(
        mockCreatePartialIndexByDateRangeOfCreatedAt,
      ).toHaveBeenCalledTimes(1);
    });
  });
  describe('With invalid parameters', () => {
    it('TC0002 - Should not create operation index if the index already exists', async () => {
      const {
        sut,
        mockGetIndexByName,
        mockCreatePartialIndexByDateRangeOfCreatedAt,
      } = makeSut();

      const oneMonthAfterCurrentDate = getMoment().add(1, 'month');

      const year = oneMonthAfterCurrentDate.year();
      const month = oneMonthAfterCurrentDate.month();

      const indexName = `Operations_created_at_index_${year}_${month + 1}`;

      await OperationsIndexFactory.create<OperationsIndexEntity>(
        OperationsIndexEntity.name,
        {
          tableName,
          indexName,
        },
      );

      mockGetIndexByName.mockResolvedValueOnce(indexName);

      await sut.execute();

      expect(mockGetIndexByName).toHaveBeenCalledTimes(2);
      expect(
        mockCreatePartialIndexByDateRangeOfCreatedAt,
      ).toHaveBeenCalledTimes(0);
    });
  });
});
