import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { OperationEntity } from '@zro/operations/domain';
import { ConversionEntity, ConversionRepository } from '@zro/otc/domain';
import { GetConversionByOperationUseCase as UseCase } from '@zro/otc/application';
import { OperationFactory } from '@zro/test/operations/config';
import { ConversionFactory } from '@zro/test/otc/config';

describe('GetConversionByUserAndIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const { conversionRepository, mockGetConversionByOperationId } =
      mockRepository();

    const sut = new UseCase(logger, conversionRepository);

    return {
      sut,
      mockGetConversionByOperationId,
    };
  };

  const mockRepository = () => {
    const conversionRepository: ConversionRepository =
      createMock<ConversionRepository>();
    const mockGetConversionByOperationId: jest.Mock = On(
      conversionRepository,
    ).get(method((mock) => mock.getByOperation));

    return {
      conversionRepository,
      mockGetConversionByOperationId,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get conversion if missing params', async () => {
      const { sut, mockGetConversionByOperationId } = makeSut();

      const tests = [
        () => sut.execute(null),
        () => sut.execute(new OperationEntity({})),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrowError(MissingDataException);
      }

      expect(mockGetConversionByOperationId).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get conversion by user and id successfully', async () => {
      const { sut, mockGetConversionByOperationId } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      const conversion = await ConversionFactory.create<ConversionEntity>(
        ConversionEntity.name,
      );

      mockGetConversionByOperationId.mockResolvedValueOnce(conversion);

      const result = await sut.execute(operation);

      expect(result).toBeDefined();
      expect(mockGetConversionByOperationId).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not get conversion if not found', async () => {
      const { sut, mockGetConversionByOperationId } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      const result = await sut.execute(operation);

      expect(result).toBeDefined();
      expect(mockGetConversionByOperationId).toHaveBeenCalledTimes(1);
    });
  });
});
