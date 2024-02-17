import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { DecodedPixKeyEntity } from '@zro/pix-keys/domain';
import {
  UserWithdrawSettingEntity,
  UserWithdrawSettingRepository,
  WithdrawSettingType,
} from '@zro/utils/domain';
import {
  TransactionTypeEntity,
  WalletAccountEntity,
} from '@zro/operations/domain';
import {
  SyncUserWithdrawSettingUseCase as UseCase,
  PixPaymentService,
  OperationService,
  PixKeyService,
} from '@zro/utils/application';
import { UserWithdrawSettingFactory } from '@zro/test/utils/config';

describe('SyncUserWithdrawSettingUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const userWithdrawSettingRepository: UserWithdrawSettingRepository =
      createMock<UserWithdrawSettingRepository>();
    const mockGetAllActiveByFilterRepository: jest.Mock = On(
      userWithdrawSettingRepository,
    ).get(method((mock) => mock.getAllActiveByFilter));

    return {
      userWithdrawSettingRepository,
      mockGetAllActiveByFilterRepository,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetWalletAccountByWalletAndCurrencyService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletAccountByWalletAndCurrency));

    const pixKeyService: PixKeyService = createMock<PixKeyService>();
    const mockCreateDecodedPixKeyService: jest.Mock = On(pixKeyService).get(
      method((mock) => mock.createDecoded),
    );

    const pixPaymentService: PixPaymentService =
      createMock<PixPaymentService>();
    const mockCreatePaymentByPixKeyService: jest.Mock = On(
      pixPaymentService,
    ).get(method((mock) => mock.createByPixKey));

    return {
      operationService,
      mockGetWalletAccountByWalletAndCurrencyService,
      pixKeyService,
      mockCreateDecodedPixKeyService,
      pixPaymentService,
      mockCreatePaymentByPixKeyService,
    };
  };

  const makeSut = () => {
    const {
      userWithdrawSettingRepository,
      mockGetAllActiveByFilterRepository,
    } = mockRepository();

    const {
      operationService,
      mockGetWalletAccountByWalletAndCurrencyService,
      pixKeyService,
      mockCreateDecodedPixKeyService,
      pixPaymentService,
      mockCreatePaymentByPixKeyService,
    } = mockService();

    const sut = new UseCase(
      logger,
      userWithdrawSettingRepository,
      operationService,
      pixKeyService,
      pixPaymentService,
      'REAL',
    );

    return {
      sut,
      mockGetAllActiveByFilterRepository,
      mockGetWalletAccountByWalletAndCurrencyService,
      mockCreateDecodedPixKeyService,
      mockCreatePaymentByPixKeyService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not sync if missing params', async () => {
      const {
        sut,
        mockGetAllActiveByFilterRepository,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockCreateDecodedPixKeyService,
        mockCreatePaymentByPixKeyService,
      } = makeSut();

      const tests = [
        () => sut.execute(null),
        () => sut.execute({ type: null }),
        () => sut.execute({ type: WithdrawSettingType.MONTHLY }),
        () => sut.execute({ type: WithdrawSettingType.WEEKLY }),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetAllActiveByFilterRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCreatePaymentByPixKeyService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should not sync if users withdraws settings not found', async () => {
      const {
        sut,
        mockGetAllActiveByFilterRepository,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockCreateDecodedPixKeyService,
        mockCreatePaymentByPixKeyService,
      } = makeSut();

      mockGetAllActiveByFilterRepository.mockResolvedValue([]);

      const filter = { type: WithdrawSettingType.DAILY };

      await sut.execute(filter);

      expect(mockGetAllActiveByFilterRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveByFilterRepository).toHaveBeenCalledWith(filter);
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCreatePaymentByPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not sync if transaction type tag not implemented', async () => {
      const {
        sut,
        mockGetAllActiveByFilterRepository,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockCreateDecodedPixKeyService,
        mockCreatePaymentByPixKeyService,
      } = makeSut();

      const usersWithdrawsSettings =
        await UserWithdrawSettingFactory.createMany<UserWithdrawSettingEntity>(
          UserWithdrawSettingEntity.name,
          5,
        );

      mockGetAllActiveByFilterRepository.mockResolvedValue(
        usersWithdrawsSettings,
      );

      const filter = { type: WithdrawSettingType.DAILY };

      await sut.execute(filter);

      expect(mockGetAllActiveByFilterRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveByFilterRepository).toHaveBeenCalledWith(filter);
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCreatePaymentByPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not sync if wallet account not has balance', async () => {
      const {
        sut,
        mockGetAllActiveByFilterRepository,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockCreateDecodedPixKeyService,
        mockCreatePaymentByPixKeyService,
      } = makeSut();

      const usersWithdrawsSettings =
        await UserWithdrawSettingFactory.createMany<UserWithdrawSettingEntity>(
          UserWithdrawSettingEntity.name,
          5,
          {
            balance: 1000,
            transactionType: new TransactionTypeEntity({ tag: 'PIXSEND' }),
          },
        );

      mockGetAllActiveByFilterRepository.mockResolvedValue(
        usersWithdrawsSettings,
      );
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValue(
        new WalletAccountEntity({ balance: 10 }),
      );

      const filter = { type: WithdrawSettingType.DAILY };

      await sut.execute(filter);

      expect(mockGetAllActiveByFilterRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveByFilterRepository).toHaveBeenCalledWith(filter);
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(5);
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCreatePaymentByPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should sync successfully', async () => {
      const {
        sut,
        mockGetAllActiveByFilterRepository,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockCreateDecodedPixKeyService,
        mockCreatePaymentByPixKeyService,
      } = makeSut();

      const usersWithdrawsSettings =
        await UserWithdrawSettingFactory.createMany<UserWithdrawSettingEntity>(
          UserWithdrawSettingEntity.name,
          5,
          {
            balance: 1000,
            transactionType: new TransactionTypeEntity({ tag: 'PIXSEND' }),
          },
        );

      mockGetAllActiveByFilterRepository.mockResolvedValue(
        usersWithdrawsSettings,
      );
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValue(
        new WalletAccountEntity({ balance: 100000 }),
      );
      mockCreateDecodedPixKeyService.mockResolvedValue(
        new DecodedPixKeyEntity({ id: uuidV4() }),
      );

      const filter = { type: WithdrawSettingType.DAILY };

      await sut.execute(filter);

      expect(mockGetAllActiveByFilterRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveByFilterRepository).toHaveBeenCalledWith(filter);
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(5);
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(5);
      expect(mockCreatePaymentByPixKeyService).toHaveBeenCalledTimes(5);
    });
  });
});
