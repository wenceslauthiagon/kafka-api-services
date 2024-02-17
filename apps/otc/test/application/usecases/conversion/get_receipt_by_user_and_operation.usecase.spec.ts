import {
  MissingDataException,
  defaultLogger as logger,
  ReceiptPortugueseTranslation,
} from '@zro/common';
import { ConversionEntity, ConversionRepository } from '@zro/otc/domain';
import {
  CurrenciesDontMatchException,
  GetConversionReceiptByUserAndOperationUseCase as UseCase,
} from '@zro/otc/application';
import { ConversionFactory } from '@zro/test/otc/config';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { UserEntity } from '@zro/users/domain';
import { CurrencyEntity, OperationEntity } from '@zro/operations/domain';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { UserFactory } from '@zro/test/users/config';
import { OperationFactory } from '@zro/test/operations/config';

describe('GetConversionReceiptByUserAndOperation', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeRepository = () => {
    const conversionRepository: ConversionRepository =
      createMock<ConversionRepository>();

    const mockGetByUserAndOperation: jest.Mock = On(conversionRepository).get(
      method((mock) => mock.getByUserAndOperation),
    );

    return {
      conversionRepository,
      mockGetByUserAndOperation,
    };
  };

  const makeSut = () => {
    const { conversionRepository, mockGetByUserAndOperation } =
      makeRepository();

    const sut = new UseCase(logger, conversionRepository);

    return {
      sut,
      mockGetByUserAndOperation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get if missing params', async () => {
      const { sut, mockGetByUserAndOperation } = makeSut();

      const tests = [
        () => sut.execute(null, null, null),
        () => sut.execute(new UserEntity({}), null, null),
        () => sut.execute(null, new OperationEntity({}), null),
        () => sut.execute(new UserEntity({}), new OperationEntity({}), null),
        () =>
          sut.execute(
            new UserEntity({ uuid: faker.datatype.uuid() }),
            new OperationEntity({}),
            null,
          ),
        () =>
          sut.execute(
            new UserEntity({}),
            new OperationEntity({ id: faker.datatype.uuid() }),
            new CurrencyEntity({}),
          ),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByUserAndOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get if conversion not found', async () => {
      const { sut, mockGetByUserAndOperation } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      const { currency } = operation;

      mockGetByUserAndOperation.mockResolvedValue(null);

      const result = await sut.execute(user, operation, currency);

      expect(result).toBeNull();
      expect(mockGetByUserAndOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByUserAndOperation).toHaveBeenCalledWith(user, operation);
    });

    it('TC0003 - Should not get if conversions dont match', async () => {
      const { sut, mockGetByUserAndOperation } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      const { currency } = operation;
      const conversion = await ConversionFactory.create<ConversionEntity>(
        ConversionEntity.name,
        {
          user,
          operation,
        },
      );

      mockGetByUserAndOperation.mockResolvedValue(conversion);

      const result = () => sut.execute(user, operation, currency);

      await expect(result).rejects.toThrow(CurrenciesDontMatchException);
      expect(mockGetByUserAndOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByUserAndOperation).toHaveBeenCalledWith(user, operation);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should get successfully', async () => {
      const { sut, mockGetByUserAndOperation } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      const { currency } = operation;
      const conversion = await ConversionFactory.create<ConversionEntity>(
        ConversionEntity.name,
        {
          user,
          operation,
          currency,
        },
      );

      mockGetByUserAndOperation.mockResolvedValue(conversion);

      const result = await sut.execute(user, operation, currency);

      expect(result).toBeDefined();
      expect(result.operationId).toBe(operation.id);
      expect(result.paymentTitle).toBe(ReceiptPortugueseTranslation.cov);
      expect(mockGetByUserAndOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByUserAndOperation).toHaveBeenCalledWith(user, operation);
    });
  });
});
