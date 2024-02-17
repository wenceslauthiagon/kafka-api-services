import {
  MissingDataException,
  defaultLogger as logger,
  ReceiptPortugueseTranslation,
} from '@zro/common';
import {
  BankingTedEntity,
  BankingTedRepository,
  BankingTedState,
} from '@zro/banking/domain';
import {
  GetBankingTedReceiptByUserAndOperationUseCase as UseCase,
  UserService,
} from '@zro/banking/application';
import { BankingTedFactory } from '@zro/test/banking/config';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity } from '@zro/operations/domain';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { UserFactory } from '@zro/test/users/config';
import { OperationFactory } from '@zro/test/operations/config';

describe('GetBankingTedReceiptByUserAndOperation', () => {
  const makeRepository = () => {
    const bankingTedRepository: BankingTedRepository =
      createMock<BankingTedRepository>();

    const mockGetByUserAndOperation: jest.Mock = On(bankingTedRepository).get(
      method((mock) => mock.getByUserAndOperation),
    );

    return {
      bankingTedRepository,
      mockGetByUserAndOperation,
    };
  };

  const mockService = () => {
    const userService: UserService = createMock<UserService>();

    const mockGetUserByUuid: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );

    return {
      userService,
      mockGetUserByUuid,
    };
  };

  const makeSut = () => {
    const { bankingTedRepository, mockGetByUserAndOperation } =
      makeRepository();

    const { userService, mockGetUserByUuid } = mockService();

    const sut = new UseCase(logger, bankingTedRepository, userService);

    return {
      sut,
      mockGetByUserAndOperation,
      mockGetUserByUuid,
    };
  };

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get if missing params', async () => {
      const { sut, mockGetByUserAndOperation, mockGetUserByUuid } = makeSut();

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(new UserEntity({}), null),
        () => sut.execute(null, new OperationEntity({})),
        () => sut.execute(new UserEntity({}), new OperationEntity({})),
        () =>
          sut.execute(
            new UserEntity({ uuid: faker.datatype.uuid() }),
            new OperationEntity({}),
          ),
        () =>
          sut.execute(
            new UserEntity({}),
            new OperationEntity({ id: faker.datatype.uuid() }),
          ),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByUserAndOperation).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get if banking ted not found', async () => {
      const { sut, mockGetByUserAndOperation, mockGetUserByUuid } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      mockGetByUserAndOperation.mockResolvedValue(null);

      const result = await sut.execute(user, operation);

      expect(result).toBeNull();
      expect(mockGetByUserAndOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByUserAndOperation).toHaveBeenCalledWith(user, operation);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not get if banking ted not has receipt', async () => {
      const { sut, mockGetByUserAndOperation, mockGetUserByUuid } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        {
          user,
          operation,
          state: BankingTedState.CONFIRMED,
        },
      );

      mockGetByUserAndOperation.mockResolvedValue(bankingTed);
      mockGetUserByUuid.mockResolvedValue(user);

      const result = await sut.execute(user, operation);

      expect(result).toBeNull();
      expect(mockGetByUserAndOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByUserAndOperation).toHaveBeenCalledWith(user, operation);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuid).toHaveBeenCalledWith({
        uuid: bankingTed.user.uuid,
      });
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should get successfully', async () => {
      const { sut, mockGetByUserAndOperation, mockGetUserByUuid } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        {
          user,
          operation,
          state: BankingTedState.FORWARDED,
        },
      );

      mockGetByUserAndOperation.mockResolvedValue(bankingTed);
      mockGetUserByUuid.mockResolvedValue(user);

      const result = await sut.execute(user, operation);

      expect(result).toBeDefined();
      expect(result.operationId).toBe(operation.id);
      expect(result.paymentTitle).toBe(ReceiptPortugueseTranslation.ted);
      expect(mockGetByUserAndOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByUserAndOperation).toHaveBeenCalledWith(user, operation);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuid).toHaveBeenCalledWith({
        uuid: bankingTed.user.uuid,
      });
    });
  });
});
