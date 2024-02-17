import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  BankingContactRepository,
  BankingAccountContactRepository,
  BankingAccountContactEntity,
} from '@zro/banking/domain';
import {
  BankingAccountContactNotFoundException,
  DeleteBankingContactByIdUseCase as UseCase,
} from '@zro/banking/application';
import { BankingAccountContactFactory } from '@zro/test/banking/config';
import { UserEntity } from '@zro/users/domain';
import { UserFactory } from '@zro/test/users/config';

describe('GetAllBankingAccountContactUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const bankingContactRepository: BankingContactRepository =
      createMock<BankingContactRepository>();
    const mockDeleteBankingContactRepository: jest.Mock = On(
      bankingContactRepository,
    ).get(method((mock) => mock.delete));

    const bankingAccountContactRepository: BankingAccountContactRepository =
      createMock<BankingAccountContactRepository>();
    const mockGetBankingAccountContactByIdRepository: jest.Mock = On(
      bankingAccountContactRepository,
    ).get(method((mock) => mock.getById));
    const mockGetBankingAccountContactByBankingContactRepository: jest.Mock =
      On(bankingAccountContactRepository).get(
        method((mock) => mock.getByBankingContact),
      );
    const mockDeleteBankingAccountContactRepository: jest.Mock = On(
      bankingAccountContactRepository,
    ).get(method((mock) => mock.delete));

    return {
      bankingContactRepository,
      mockDeleteBankingContactRepository,
      bankingAccountContactRepository,
      mockGetBankingAccountContactByIdRepository,
      mockGetBankingAccountContactByBankingContactRepository,
      mockDeleteBankingAccountContactRepository,
    };
  };

  const makeSut = () => {
    const {
      bankingContactRepository,
      mockDeleteBankingContactRepository,
      bankingAccountContactRepository,
      mockGetBankingAccountContactByIdRepository,
      mockGetBankingAccountContactByBankingContactRepository,
      mockDeleteBankingAccountContactRepository,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      bankingContactRepository,
      bankingAccountContactRepository,
    );

    return {
      sut,
      mockDeleteBankingContactRepository,
      mockGetBankingAccountContactByIdRepository,
      mockGetBankingAccountContactByBankingContactRepository,
      mockDeleteBankingAccountContactRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should delete banking account contact  successfully', async () => {
      const {
        sut,
        mockDeleteBankingContactRepository,
        mockGetBankingAccountContactByIdRepository,
        mockGetBankingAccountContactByBankingContactRepository,
        mockDeleteBankingAccountContactRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const [bankingAccountContact, ...otherBankingAccountsContact] =
        await BankingAccountContactFactory.createMany<BankingAccountContactEntity>(
          BankingAccountContactEntity.name,
          10,
        );

      mockGetBankingAccountContactByIdRepository.mockResolvedValueOnce(
        bankingAccountContact,
      );
      mockGetBankingAccountContactByBankingContactRepository.mockResolvedValueOnce(
        [otherBankingAccountsContact],
      );

      await sut.execute(bankingAccountContact.id, user);

      expect(mockGetBankingAccountContactByIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetBankingAccountContactByIdRepository).toBeCalledWith(
        bankingAccountContact.id,
      );
      expect(mockDeleteBankingAccountContactRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockDeleteBankingAccountContactRepository).toHaveBeenCalledWith(
        bankingAccountContact,
      );
      expect(
        mockGetBankingAccountContactByBankingContactRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetBankingAccountContactByBankingContactRepository,
      ).toBeCalledWith(bankingAccountContact.bankingContact);
      expect(mockDeleteBankingContactRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should delete banking account contact and banking contact  successfully', async () => {
      const {
        sut,
        mockDeleteBankingContactRepository,
        mockGetBankingAccountContactByIdRepository,
        mockGetBankingAccountContactByBankingContactRepository,
        mockDeleteBankingAccountContactRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const bankingAccountContact =
        await BankingAccountContactFactory.create<BankingAccountContactEntity>(
          BankingAccountContactEntity.name,
        );

      mockGetBankingAccountContactByIdRepository.mockResolvedValueOnce(
        bankingAccountContact,
      );
      mockGetBankingAccountContactByBankingContactRepository.mockResolvedValueOnce(
        [],
      );

      await sut.execute(bankingAccountContact.id, user);

      expect(mockGetBankingAccountContactByIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetBankingAccountContactByIdRepository).toBeCalledWith(
        bankingAccountContact.id,
      );
      expect(mockDeleteBankingAccountContactRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockDeleteBankingAccountContactRepository).toHaveBeenCalledWith(
        bankingAccountContact,
      );
      expect(
        mockGetBankingAccountContactByBankingContactRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetBankingAccountContactByBankingContactRepository,
      ).toBeCalledWith(bankingAccountContact.bankingContact);
      expect(mockDeleteBankingContactRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not delete if missing params', async () => {
      const {
        sut,
        mockGetBankingAccountContactByIdRepository,
        mockDeleteBankingContactRepository,
        mockGetBankingAccountContactByBankingContactRepository,
        mockDeleteBankingAccountContactRepository,
      } = makeSut();

      const bankingAccountContact =
        await BankingAccountContactFactory.create<BankingAccountContactEntity>(
          BankingAccountContactEntity.name,
        );

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(null, new UserEntity({})),
        () => sut.execute(bankingAccountContact.id, null),
        () => sut.execute(bankingAccountContact.id, new UserEntity({})),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetBankingAccountContactByIdRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockDeleteBankingAccountContactRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(
        mockGetBankingAccountContactByBankingContactRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockDeleteBankingContactRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not delete if banking account contact not found', async () => {
      const {
        sut,
        mockDeleteBankingContactRepository,
        mockGetBankingAccountContactByIdRepository,
        mockGetBankingAccountContactByBankingContactRepository,
        mockDeleteBankingAccountContactRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const bankingAccountContact =
        await BankingAccountContactFactory.create<BankingAccountContactEntity>(
          BankingAccountContactEntity.name,
        );

      mockGetBankingAccountContactByIdRepository.mockResolvedValueOnce(null);

      const test = () => sut.execute(bankingAccountContact.id, user);

      await expect(test).rejects.toThrow(
        BankingAccountContactNotFoundException,
      );

      expect(mockGetBankingAccountContactByIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockDeleteBankingAccountContactRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(
        mockGetBankingAccountContactByBankingContactRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockDeleteBankingContactRepository).toHaveBeenCalledTimes(0);
    });
  });
});
