import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  defaultLogger as logger,
  MissingDataException,
  PaginationEntity,
  paginationToDomain,
} from '@zro/common';
import { GetAllWalletInvitationByEmailUseCase as UseCase } from '@zro/operations/application';
import {
  WalletInvitationEntity,
  WalletInvitationRepository,
} from '@zro/operations/domain';
import { WalletInvitationFactory } from '@zro/test/operations/config';

describe('GetAllWalletInvitationByEmailUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const walletInvitationRepository: WalletInvitationRepository =
      createMock<WalletInvitationRepository>();
    const mockGetByEmailAndFilterNotExpiredRepository: jest.Mock = On(
      walletInvitationRepository,
    ).get(method((mock) => mock.getByEmailAndFilterAndNotExpired));

    return {
      walletInvitationRepository,
      mockGetByEmailAndFilterNotExpiredRepository,
    };
  };

  const makeSut = () => {
    const {
      walletInvitationRepository,
      mockGetByEmailAndFilterNotExpiredRepository,
    } = mockRepository();

    const sut = new UseCase(logger, walletInvitationRepository);

    return {
      sut,
      mockGetByEmailAndFilterNotExpiredRepository,
    };
  };

  describe('With invalid  parameters', () => {
    it('TC0001 - Should not get all if missing params', async () => {
      const { sut, mockGetByEmailAndFilterNotExpiredRepository } = makeSut();

      const tests = [() => sut.execute(null, null, null)];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByEmailAndFilterNotExpiredRepository).toHaveBeenCalledTimes(
        0,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get all with valid parameters', async () => {
      const { sut, mockGetByEmailAndFilterNotExpiredRepository } = makeSut();

      const pagination = new PaginationEntity();
      const filter = {};
      const email = 'test@zro.com.br';

      const walletInvitations =
        await WalletInvitationFactory.createMany<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          5,
          { email },
        );

      mockGetByEmailAndFilterNotExpiredRepository.mockResolvedValue(
        paginationToDomain(
          pagination,
          walletInvitations.length,
          walletInvitations,
        ),
      );

      const result = await sut.execute(pagination, filter, email);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.email).toBe(email);
        expect(res.permissionTypes).toHaveLength(1);
      });
      expect(mockGetByEmailAndFilterNotExpiredRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetByEmailAndFilterNotExpiredRepository).toHaveBeenCalledWith(
        pagination,
        filter,
        email,
      );
    });
  });
});
