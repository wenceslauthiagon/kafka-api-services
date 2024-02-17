import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { HandleCreateOperationStreamQuotationEventUseCase as UseCase } from '@zro/operations/application';
import {
  OperationStreamQuotationEntity,
  OperationStreamQuotationRepository,
} from '@zro/operations/domain';
import { OperationStreamQuotationFactory } from '@zro/test/operations/config';

describe('HandleCreateOperationStreamQuotationEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const operationStreamQuotationRepository: OperationStreamQuotationRepository =
      createMock<OperationStreamQuotationRepository>();

    const mockCreateOrUpdate: jest.Mock = On(
      operationStreamQuotationRepository,
    ).get(method((mock) => mock.createOrUpdate));

    return {
      operationStreamQuotationRepository,
      mockCreateOrUpdate,
    };
  };

  const makeSut = () => {
    const { operationStreamQuotationRepository, mockCreateOrUpdate } =
      mockRepository();

    const sut = new UseCase(logger, operationStreamQuotationRepository);
    return {
      sut,
      mockCreateOrUpdate,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should Create or Update successfully', async () => {
      const { sut, mockCreateOrUpdate } = makeSut();

      const operationStreamQuotations =
        await OperationStreamQuotationFactory.createMany<OperationStreamQuotationEntity>(
          OperationStreamQuotationEntity.name,
          10,
        );

      const result = await sut.execute(operationStreamQuotations);

      expect(result).toBeDefined();
      expect(mockCreateOrUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
