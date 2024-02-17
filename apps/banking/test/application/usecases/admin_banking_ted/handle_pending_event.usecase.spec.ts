import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  AdminBankingTedEntity,
  AdminBankingTedRepository,
  AdminBankingAccountEntity,
  AdminBankingAccountRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  HandlePendingAdminBankingTedEventUseCase as UseCase,
  BankingTedGateway,
  AdminBankingTedEventEmitter,
  AdminBankingAccountNotActiveException,
  AdminBankingTedInvalidStateException,
} from '@zro/banking/application';
import {
  AdminBankingAccountFactory,
  AdminBankingTedFactory,
} from '@zro/test/banking/config';

describe('HandlePendingAdminBankingTedEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      AdminbankingTedRepository,
      mockGetAdminBankingTedByIdRepository,
      mockUpdateAdminBankingTedRepository,
      AdminBankingAccountRepository,
      mockGetAdminBankingAccountByIdRepository,
    } = mockRepository();

    const { eventEmitter, mockWaitingAdminBankingTedEventEmitter } =
      mockEmitter();

    const { pspGateway, mockCreateGateway } = mockGateway();

    const bankingTedCallbackUrl = 'localhost';

    const sut = new UseCase(
      logger,
      AdminbankingTedRepository,
      AdminBankingAccountRepository,
      pspGateway,
      eventEmitter,
      bankingTedCallbackUrl,
    );
    return {
      sut,
      mockGetAdminBankingTedByIdRepository,
      mockUpdateAdminBankingTedRepository,
      mockGetAdminBankingAccountByIdRepository,
      mockCreateGateway,
      mockWaitingAdminBankingTedEventEmitter,
    };
  };

  const mockRepository = () => {
    const AdminbankingTedRepository: AdminBankingTedRepository =
      createMock<AdminBankingTedRepository>();
    const mockGetAdminBankingTedByIdRepository: jest.Mock = On(
      AdminbankingTedRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdateAdminBankingTedRepository: jest.Mock = On(
      AdminbankingTedRepository,
    ).get(method((mock) => mock.update));

    const AdminBankingAccountRepository: AdminBankingAccountRepository =
      createMock<AdminBankingAccountRepository>();
    const mockGetAdminBankingAccountByIdRepository: jest.Mock = On(
      AdminBankingAccountRepository,
    ).get(method((mock) => mock.getById));

    return {
      AdminbankingTedRepository,
      mockGetAdminBankingTedByIdRepository,
      mockUpdateAdminBankingTedRepository,
      AdminBankingAccountRepository,
      mockGetAdminBankingAccountByIdRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: AdminBankingTedEventEmitter =
      createMock<AdminBankingTedEventEmitter>();
    const mockWaitingAdminBankingTedEventEmitter: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.waitingAdminBankingTed));

    return {
      eventEmitter,
      mockWaitingAdminBankingTedEventEmitter,
    };
  };

  const mockGateway = () => {
    const pspGateway: BankingTedGateway = createMock<BankingTedGateway>();
    const mockCreateGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.createBankingTed),
    );

    return {
      pspGateway,
      mockCreateGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle pending successfully', async () => {
      const {
        sut,
        mockUpdateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockCreateGateway,
        mockWaitingAdminBankingTedEventEmitter,
      } = makeSut();

      const source =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
        );

      const destination =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          {
            source,
            destination,
          },
        );

      const { id } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );
      mockGetAdminBankingAccountByIdRepository.mockResolvedValueOnce(source);
      mockGetAdminBankingAccountByIdRepository.mockResolvedValueOnce(
        destination,
      );

      const result = await sut.execute(id);

      expect(result.state).toBe(AdminBankingTedState.WAITING);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(2);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenNthCalledWith(
        2,
        destination.id,
      );
      expect(mockCreateGateway).toHaveBeenCalledTimes(1);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not handle pending when missing params', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockWaitingAdminBankingTedEventEmitter,
      } = makeSut();

      const test = () => sut.execute(null);

      await expect(test).rejects.toThrow(MissingDataException);

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockWaitingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not handle pending when state is invalid', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockWaitingAdminBankingTedEventEmitter,
      } = makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          {
            state: AdminBankingTedState.FAILED,
          },
        );

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );

      const test = () => sut.execute(adminBankingTed.id);

      await expect(test).rejects.toThrow(AdminBankingTedInvalidStateException);

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockWaitingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not handle pending if source account not active', async () => {
      const {
        sut,
        mockUpdateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockCreateGateway,
        mockWaitingAdminBankingTedEventEmitter,
      } = makeSut();

      const source =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
          {
            enabled: false,
          },
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          {
            source,
          },
        );

      const { id } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );
      mockGetAdminBankingAccountByIdRepository.mockResolvedValueOnce(source);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(
        AdminBankingAccountNotActiveException,
      );

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenNthCalledWith(
        1,
        source.id,
      );
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockWaitingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not handle pending if source account not active', async () => {
      const {
        sut,
        mockUpdateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockCreateGateway,
        mockWaitingAdminBankingTedEventEmitter,
      } = makeSut();

      const source =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
        );

      const destination =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
          {
            enabled: false,
          },
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          {
            source,
            destination,
          },
        );

      const { id } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );
      mockGetAdminBankingAccountByIdRepository.mockResolvedValueOnce(source);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(
        AdminBankingAccountNotActiveException,
      );

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(2);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenNthCalledWith(
        2,
        destination.id,
      );
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockWaitingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not handle pending if psp gatewat throws', async () => {
      const {
        sut,
        mockUpdateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockCreateGateway,
        mockWaitingAdminBankingTedEventEmitter,
      } = makeSut();

      const source =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
        );

      const destination =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          {
            source,
            destination,
          },
        );

      const { id } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );
      mockGetAdminBankingAccountByIdRepository.mockResolvedValueOnce(source);
      mockGetAdminBankingAccountByIdRepository.mockResolvedValueOnce(
        destination,
      );

      mockCreateGateway.mockRejectedValueOnce(new Error());

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow();

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(2);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenNthCalledWith(
        2,
        destination.id,
      );
      expect(mockCreateGateway).toHaveBeenCalledTimes(1);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockWaitingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });
});
