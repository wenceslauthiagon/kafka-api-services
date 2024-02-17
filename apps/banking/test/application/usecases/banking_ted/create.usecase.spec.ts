import * as moment from 'moment';
import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
} from '@zro/common';
import * as utilGetMoment from '@zro/common/utils/get_moment.util';
import * as utilIsHourInRange from '@zro/common/utils/is_hour_in_range.util';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity, WalletEntity } from '@zro/operations/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  BankTedEntity,
  BankTedRepository,
  BankingTedEntity,
  BankingTedRepository,
} from '@zro/banking/domain';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import {
  CreateBankingTedUseCase as UseCase,
  BankingTedEventEmitter,
  UserService,
  QuotationService,
  BankingTedIntervalInvalidException,
  BankingTedWeekdayInvalidException,
  BankTedNotFoundException,
  BankingTedHolidayInvalidException,
} from '@zro/banking/application';
import { BankingTedFactory, BankTedFactory } from '@zro/test/banking/config';
import { UserFactory } from '@zro/test/users/config';
import { WalletFactory } from '@zro/test/operations/config';

describe('CreateBankingTedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      bankingTedRepository,
      bankTedRepository,
      mockGetOperationIdBankingTedRepository,
      mockCreateBankingTedRepository,
      mockGetBankTedByCodeRepository,
    } = mockRepository();

    const { eventEmitter, mockPendingBankingTedEventEmitter } = mockEmitter();

    const {
      userService,
      quotationService,
      mockGetUserByUuidService,
      mockGetOnboardingService,
      mockGetHolidayByDateService,
    } = mockService();

    const mockIsHourInRange = jest.spyOn(utilIsHourInRange, 'isHourInRange');
    const mockMomentUtc = jest.spyOn(utilGetMoment, 'getMoment');

    const bankingTedOperationCurrencyTag = 'REAL';
    const bankingTedIntervalHour = '09:00;16:00';

    const sut = new UseCase(
      logger,
      bankingTedRepository,
      bankTedRepository,
      eventEmitter,
      userService,
      quotationService,
      bankingTedOperationCurrencyTag,
      bankingTedIntervalHour,
    );
    return {
      sut,
      mockIsHourInRange,
      mockMomentUtc,
      mockGetOperationIdBankingTedRepository,
      mockCreateBankingTedRepository,
      mockGetBankTedByCodeRepository,
      mockPendingBankingTedEventEmitter,
      mockGetUserByUuidService,
      mockGetOnboardingService,
      mockGetHolidayByDateService,
    };
  };

  const mockRepository = () => {
    const bankingTedRepository: BankingTedRepository =
      createMock<BankingTedRepository>();
    const mockGetOperationIdBankingTedRepository: jest.Mock = On(
      bankingTedRepository,
    ).get(method((mock) => mock.getByOperation));
    const mockCreateBankingTedRepository: jest.Mock = On(
      bankingTedRepository,
    ).get(method((mock) => mock.create));
    const bankTedRepository: BankTedRepository =
      createMock<BankTedRepository>();
    const mockGetBankTedByCodeRepository: jest.Mock = On(bankTedRepository).get(
      method((mock) => mock.getByCode),
    );

    return {
      bankingTedRepository,
      bankTedRepository,
      mockGetOperationIdBankingTedRepository,
      mockCreateBankingTedRepository,
      mockGetBankTedByCodeRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: BankingTedEventEmitter =
      createMock<BankingTedEventEmitter>();
    const mockPendingBankingTedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.pendingBankingTed),
    );

    return {
      eventEmitter,
      mockPendingBankingTedEventEmitter,
    };
  };

  const mockService = () => {
    const userService: UserService = createMock<UserService>();
    const mockGetUserByUuidService: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );
    const mockGetOnboardingService: jest.Mock = On(userService).get(
      method((mock) => mock.getOnboardingByUserAndStatusIsFinished),
    );

    const quotationService: QuotationService = createMock<QuotationService>();
    const mockGetHolidayByDateService: jest.Mock = On(quotationService).get(
      method((mock) => mock.getHolidayByDate),
    );

    return {
      userService,
      quotationService,
      mockGetUserByUuidService,
      mockGetOnboardingService,
      mockGetHolidayByDateService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle pending when parameters is null', async () => {
      const {
        sut,
        mockGetOperationIdBankingTedRepository,
        mockCreateBankingTedRepository,
        mockGetBankTedByCodeRepository,
        mockPendingBankingTedEventEmitter,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetHolidayByDateService,
      } = makeSut();

      const test = [
        () =>
          sut.execute(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            new UserEntity({ uuid: uuidV4() }),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            new WalletEntity({ uuid: uuidV4() }),
            new OperationEntity({ id: uuidV4() }),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            123,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            null,
            'test',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            null,
            null,
            'test',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            null,
            null,
            null,
            'test',
            null,
            null,
            null,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            null,
            null,
            null,
            'test',
            null,
            null,
            null,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'test',
            null,
            null,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'test',
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'test',
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            AccountType.CC,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'test',
          ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockGetOperationIdBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockGetBankTedByCodeRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingBankingTedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetHolidayByDateService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if bankingTed already exists and user is forbidden', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = new OperationEntity({ id: uuidV4() });
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
      );

      const {
        amount,
        beneficiaryBankCode,
        beneficiaryName,
        beneficiaryType,
        beneficiaryDocument,
        beneficiaryAgency,
        beneficiaryAccount,
        beneficiaryAccountDigit,
        beneficiaryAccountType,
      } = bankingTed;

      const {
        sut,
        mockGetOperationIdBankingTedRepository,
        mockCreateBankingTedRepository,
        mockGetBankTedByCodeRepository,
        mockPendingBankingTedEventEmitter,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetHolidayByDateService,
      } = makeSut();

      mockGetOperationIdBankingTedRepository.mockResolvedValue(bankingTed);

      const testScript = () =>
        sut.execute(
          user,
          wallet,
          operation,
          amount,
          beneficiaryBankCode,
          beneficiaryName,
          beneficiaryType,
          beneficiaryDocument,
          beneficiaryAgency,
          beneficiaryAccount,
          beneficiaryAccountDigit,
          beneficiaryAccountType,
        );

      await expect(testScript).rejects.toThrow(ForbiddenException);

      expect(mockGetOperationIdBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockGetBankTedByCodeRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingBankingTedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetHolidayByDateService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if user not found', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = new OperationEntity({ id: uuidV4() });
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { user },
      );

      const {
        amount,
        beneficiaryBankCode,
        beneficiaryName,
        beneficiaryType,
        beneficiaryDocument,
        beneficiaryAgency,
        beneficiaryAccount,
        beneficiaryAccountDigit,
        beneficiaryAccountType,
      } = bankingTed;

      const {
        sut,
        mockGetOperationIdBankingTedRepository,
        mockCreateBankingTedRepository,
        mockGetBankTedByCodeRepository,
        mockPendingBankingTedEventEmitter,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetHolidayByDateService,
      } = makeSut();

      mockGetOperationIdBankingTedRepository.mockResolvedValue(null);
      mockGetUserByUuidService.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(
          user,
          wallet,
          operation,
          amount,
          beneficiaryBankCode,
          beneficiaryName,
          beneficiaryType,
          beneficiaryDocument,
          beneficiaryAgency,
          beneficiaryAccount,
          beneficiaryAccountDigit,
          beneficiaryAccountType,
        );

      await expect(testScript).rejects.toThrow(UserNotFoundException);

      expect(mockGetOperationIdBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockGetBankTedByCodeRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingBankingTedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetHolidayByDateService).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if onboarding not found', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = new OperationEntity({ id: uuidV4() });
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { user },
      );

      const {
        amount,
        beneficiaryBankCode,
        beneficiaryName,
        beneficiaryType,
        beneficiaryDocument,
        beneficiaryAgency,
        beneficiaryAccount,
        beneficiaryAccountDigit,
        beneficiaryAccountType,
      } = bankingTed;

      const {
        sut,
        mockGetOperationIdBankingTedRepository,
        mockCreateBankingTedRepository,
        mockGetBankTedByCodeRepository,
        mockPendingBankingTedEventEmitter,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetHolidayByDateService,
      } = makeSut();

      mockGetOperationIdBankingTedRepository.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue(null);
      mockGetUserByUuidService.mockResolvedValue(user);

      const testScript = () =>
        sut.execute(
          user,
          wallet,
          operation,
          amount,
          beneficiaryBankCode,
          beneficiaryName,
          beneficiaryType,
          beneficiaryDocument,
          beneficiaryAgency,
          beneficiaryAccount,
          beneficiaryAccountDigit,
          beneficiaryAccountType,
        );

      await expect(testScript).rejects.toThrow(OnboardingNotFoundException);

      expect(mockGetOperationIdBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockGetBankTedByCodeRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingBankingTedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDateService).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create if hour is out of range', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = new OperationEntity({ id: uuidV4() });
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { user },
      );

      const {
        amount,
        beneficiaryBankCode,
        beneficiaryName,
        beneficiaryType,
        beneficiaryDocument,
        beneficiaryAgency,
        beneficiaryAccount,
        beneficiaryAccountDigit,
        beneficiaryAccountType,
      } = bankingTed;

      const {
        sut,
        mockIsHourInRange,
        mockGetOperationIdBankingTedRepository,
        mockCreateBankingTedRepository,
        mockGetBankTedByCodeRepository,
        mockPendingBankingTedEventEmitter,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetHolidayByDateService,
      } = makeSut();

      mockGetOperationIdBankingTedRepository.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);
      mockIsHourInRange.mockImplementation(() => false);

      const testScript = () =>
        sut.execute(
          user,
          wallet,
          operation,
          amount,
          beneficiaryBankCode,
          beneficiaryName,
          beneficiaryType,
          beneficiaryDocument,
          beneficiaryAgency,
          beneficiaryAccount,
          beneficiaryAccountDigit,
          beneficiaryAccountType,
        );

      await expect(testScript).rejects.toThrow(
        BankingTedIntervalInvalidException,
      );

      expect(mockGetOperationIdBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockGetBankTedByCodeRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingBankingTedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDateService).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not create if today is weekend', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = new OperationEntity({ id: uuidV4() });
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const {
        amount,
        beneficiaryBankCode,
        beneficiaryName,
        beneficiaryType,
        beneficiaryDocument,
        beneficiaryAgency,
        beneficiaryAccount,
        beneficiaryAccountDigit,
        beneficiaryAccountType,
      } = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { user },
      );

      const {
        sut,
        mockIsHourInRange,
        mockMomentUtc,
        mockGetOperationIdBankingTedRepository,
        mockCreateBankingTedRepository,
        mockGetBankTedByCodeRepository,
        mockPendingBankingTedEventEmitter,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetHolidayByDateService,
      } = makeSut();

      mockGetOperationIdBankingTedRepository.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);
      mockIsHourInRange.mockImplementation(() => true);
      mockMomentUtc.mockImplementation(() => moment().day(0));

      const testScript = () =>
        sut.execute(
          user,
          wallet,
          operation,
          amount,
          beneficiaryBankCode,
          beneficiaryName,
          beneficiaryType,
          beneficiaryDocument,
          beneficiaryAgency,
          beneficiaryAccount,
          beneficiaryAccountDigit,
          beneficiaryAccountType,
        );

      await expect(testScript).rejects.toThrow(
        BankingTedWeekdayInvalidException,
      );

      expect(mockGetOperationIdBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockGetBankTedByCodeRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingBankingTedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDateService).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not create if today is holiday', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = new OperationEntity({ id: uuidV4() });
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { user },
      );

      const {
        amount,
        beneficiaryBankCode,
        beneficiaryName,
        beneficiaryType,
        beneficiaryDocument,
        beneficiaryAgency,
        beneficiaryAccount,
        beneficiaryAccountDigit,
        beneficiaryAccountType,
      } = bankingTed;

      const {
        sut,
        mockIsHourInRange,
        mockMomentUtc,
        mockGetOperationIdBankingTedRepository,
        mockCreateBankingTedRepository,
        mockGetBankTedByCodeRepository,
        mockPendingBankingTedEventEmitter,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetHolidayByDateService,
      } = makeSut();

      mockGetOperationIdBankingTedRepository.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);
      mockIsHourInRange.mockImplementation(() => true);
      mockMomentUtc.mockImplementation(() => moment().day(1));
      mockGetHolidayByDateService.mockResolvedValue({ id: uuidV4() });

      const testScript = () =>
        sut.execute(
          user,
          wallet,
          operation,
          amount,
          beneficiaryBankCode,
          beneficiaryName,
          beneficiaryType,
          beneficiaryDocument,
          beneficiaryAgency,
          beneficiaryAccount,
          beneficiaryAccountDigit,
          beneficiaryAccountType,
        );

      await expect(testScript).rejects.toThrow(
        BankingTedHolidayInvalidException,
      );

      expect(mockGetOperationIdBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockGetBankTedByCodeRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingBankingTedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDateService).toHaveBeenCalledTimes(1);
    });

    it('TC0008 - Should not create if bank ted not found', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = new OperationEntity({ id: uuidV4() });
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { user },
      );

      const {
        amount,
        beneficiaryBankCode,
        beneficiaryName,
        beneficiaryType,
        beneficiaryDocument,
        beneficiaryAgency,
        beneficiaryAccount,
        beneficiaryAccountDigit,
        beneficiaryAccountType,
      } = bankingTed;

      const {
        sut,
        mockIsHourInRange,
        mockMomentUtc,
        mockGetOperationIdBankingTedRepository,
        mockCreateBankingTedRepository,
        mockGetBankTedByCodeRepository,
        mockPendingBankingTedEventEmitter,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetHolidayByDateService,
      } = makeSut();

      mockGetOperationIdBankingTedRepository.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);
      mockIsHourInRange.mockImplementation(() => true);
      mockMomentUtc.mockImplementation(() => moment().day(1));
      mockGetHolidayByDateService.mockResolvedValue(null);
      mockGetBankTedByCodeRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(
          user,
          wallet,
          operation,
          amount,
          beneficiaryBankCode,
          beneficiaryName,
          beneficiaryType,
          beneficiaryDocument,
          beneficiaryAgency,
          beneficiaryAccount,
          beneficiaryAccountDigit,
          beneficiaryAccountType,
        );

      await expect(testScript).rejects.toThrow(BankTedNotFoundException);

      expect(mockGetOperationIdBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockGetBankTedByCodeRepository).toHaveBeenCalledTimes(1);
      expect(mockPendingBankingTedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDateService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0009 - Should create successfully', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = new OperationEntity({ id: uuidV4() });
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const bankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
      );

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { user },
      );

      const {
        amount,
        beneficiaryBankCode,
        beneficiaryName,
        beneficiaryType,
        beneficiaryDocument,
        beneficiaryAgency,
        beneficiaryAccount,
        beneficiaryAccountDigit,
        beneficiaryAccountType,
      } = bankingTed;

      const {
        sut,
        mockIsHourInRange,
        mockMomentUtc,
        mockGetOperationIdBankingTedRepository,
        mockCreateBankingTedRepository,
        mockGetBankTedByCodeRepository,
        mockPendingBankingTedEventEmitter,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetHolidayByDateService,
      } = makeSut();

      mockGetOperationIdBankingTedRepository.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);
      mockIsHourInRange.mockImplementation(() => true);
      mockMomentUtc.mockImplementation(() => moment().day(1));
      mockGetHolidayByDateService.mockResolvedValue(null);
      mockGetBankTedByCodeRepository.mockResolvedValue(bankTed);

      const result = await sut.execute(
        user,
        wallet,
        operation,
        amount,
        beneficiaryBankCode,
        beneficiaryName,
        beneficiaryType,
        beneficiaryDocument,
        beneficiaryAgency,
        beneficiaryAccount,
        beneficiaryAccountDigit,
        beneficiaryAccountType,
      );

      expect(result).toBeDefined();
      expect(mockGetOperationIdBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankTedByCodeRepository).toHaveBeenCalledTimes(1);
      expect(mockPendingBankingTedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetHolidayByDateService).toHaveBeenCalledTimes(1);
    });
  });
});
