import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  OperationsIndexEntity,
  OperationsIndexRepository,
} from '@zro/operations/domain';
import { SyncDeleteOperationIndexUseCase as UseCase } from '@zro/operations/application';
import { OperationsIndexFactory } from '@zro/test/operations/config';

const tableName = 'Operations';

describe('SyncDeleteOperationIndexUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const operationsIndexRepository: OperationsIndexRepository =
      createMock<OperationsIndexRepository>();
    const mockGetAllIndexesByTable: jest.Mock = On(
      operationsIndexRepository,
    ).get(method((mock) => mock.getAllByTable));
    const mockDeletePartialIndexByDateRange: jest.Mock = On(
      operationsIndexRepository,
    ).get(method((mock) => mock.dropIndex));

    return {
      operationsIndexRepository,
      mockGetAllIndexesByTable,
      mockDeletePartialIndexByDateRange,
    };
  };

  const makeSut = () => {
    const {
      operationsIndexRepository,
      mockGetAllIndexesByTable,
      mockDeletePartialIndexByDateRange,
    } = mockRepository();

    const sut = new UseCase(logger, operationsIndexRepository, tableName);

    return {
      sut,
      mockGetAllIndexesByTable,
      mockDeletePartialIndexByDateRange,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should sync delete operation index', async () => {
      const {
        sut,
        mockGetAllIndexesByTable,
        mockDeletePartialIndexByDateRange,
      } = makeSut();

      const year = faker.datatype.number({
        max: 2017,
        min: 2015,
      });

      const month = faker.datatype.number({ max: 12, min: 1 });

      const operationsIndexes =
        await OperationsIndexFactory.createMany<OperationsIndexEntity>(
          OperationsIndexEntity.name,
          1,
          {
            tableName,
            indexName: `Operations_created_at_index_${year}_${month}`,
          },
        );

      mockGetAllIndexesByTable.mockResolvedValueOnce(operationsIndexes);

      await sut.execute();

      expect(mockGetAllIndexesByTable).toHaveBeenCalledTimes(1);
      expect(mockDeletePartialIndexByDateRange).toHaveBeenCalledTimes(1);
    });
  });
  describe('With invalid parameters', () => {
    it('TC0002 - Should not delete operation indexes when indexes not found', async () => {
      const {
        sut,
        mockGetAllIndexesByTable,
        mockDeletePartialIndexByDateRange,
      } = makeSut();

      mockGetAllIndexesByTable.mockResolvedValueOnce(null);

      await sut.execute();

      expect(mockGetAllIndexesByTable).toHaveBeenCalledTimes(1);
      expect(mockDeletePartialIndexByDateRange).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not delete operation indexes when base index name not matches', async () => {
      const {
        sut,
        mockGetAllIndexesByTable,
        mockDeletePartialIndexByDateRange,
      } = makeSut();

      const operationsIndexes =
        await OperationsIndexFactory.createMany<OperationsIndexEntity>(
          OperationsIndexEntity.name,
          2,
        );

      mockGetAllIndexesByTable.mockResolvedValueOnce(operationsIndexes);

      await sut.execute();

      expect(mockGetAllIndexesByTable).toHaveBeenCalledTimes(1);
      expect(mockDeletePartialIndexByDateRange).toHaveBeenCalledTimes(0);
    });
  });
});
