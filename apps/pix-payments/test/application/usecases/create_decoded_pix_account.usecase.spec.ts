import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
} from '@zro/common';
import {
  AccountType,
  DecodedPixAccountEntity,
  DecodedPixAccountRepository,
} from '@zro/pix-payments/domain';
import { OnboardingStatus, UserEntity, PersonType } from '@zro/users/domain';
import { BankEntity } from '@zro/banking/domain';
import {
  CreateDecodedPixAccountUseCase as UseCase,
  KycGateway,
  UserService,
  BankingService,
  BankNotFoundException,
  DecodedPixAccountEventEmitter,
  MaxDecodedPixAccountRequestsPerDayReached,
  DecodedPixAccountOwnedByUserException,
  KYCNotFoundException,
  GetOnboardingByDocumentAndStatusIsFinishedServiceResponse,
  DecodedPixAccountDocumentAndPersonTypeConflictException,
  GetKycInfoResponse,
} from '@zro/pix-payments/application';
import { UserFactory } from '@zro/test/users/config';
import { DecodedPixAccountFactory } from '@zro/test/pix-payments/config';
import { BankFactory } from '@zro/test/banking/config';

describe('DecodeAccountUseCase', () => {
  const makeSut = (maxPerDay = 10) => {
    const userService: UserService = createMock<UserService>();
    const mockGetUserService: jest.Mock = On(userService).get(
      method((mock) => mock.getOnboardingByCpfAndStatusIsFinished),
    );
    const bankingService: BankingService = createMock<BankingService>();
    const mockGetBankingService: jest.Mock = On(bankingService).get(
      method((mock) => mock.getBankByIspb),
    );
    const kycGateway: KycGateway = createMock<KycGateway>();
    const mockGetKYCInfo: jest.Mock = On(kycGateway).get(
      method((mock) => mock.getKycInfo),
    );

    const {
      decodeAccountRepository,
      mockCreateRepository,
      mockGetByIdRepository,
      mockCountPendingLast24Repository,
      mockGetByDocumentAndAccountAndBranchRepository,
    } = mockRepository();
    const { eventEmitter, mockPendingDecodedPixAccountEvent } = mockEmitter();

    const pixPaymentZroBankIspb = '26264220';

    const sut = new UseCase(
      logger,
      decodeAccountRepository,
      eventEmitter,
      bankingService,
      userService,
      maxPerDay,
      kycGateway,
      pixPaymentZroBankIspb,
    );
    return {
      sut,
      mockCreateRepository,
      mockGetByIdRepository,
      mockCountPendingLast24Repository,
      mockGetUserService,
      mockGetBankingService,
      mockGetKYCInfo,
      mockPendingDecodedPixAccountEvent,
      mockGetByDocumentAndAccountAndBranchRepository,
      pixPaymentZroBankIspb,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: DecodedPixAccountEventEmitter =
      createMock<DecodedPixAccountEventEmitter>();
    const mockPendingDecodedPixAccountEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.pendingDecodedPixAccount),
    );

    return {
      eventEmitter,
      mockPendingDecodedPixAccountEvent,
    };
  };

  const mockRepository = () => {
    const decodeAccountRepository: DecodedPixAccountRepository =
      createMock<DecodedPixAccountRepository>();
    const mockCreateRepository: jest.Mock = On(decodeAccountRepository).get(
      method((mock) => mock.create),
    );
    const mockGetByIdRepository: jest.Mock = On(decodeAccountRepository).get(
      method((mock) => mock.getById),
    );

    const mockCountPendingLast24Repository: jest.Mock = On(
      decodeAccountRepository,
    ).get(method((mock) => mock.countByUserAndStatePendingLast24Hours));

    const mockGetByDocumentAndAccountAndBranchRepository: jest.Mock = On(
      decodeAccountRepository,
    ).get(method((mock) => mock.getByDocumentAndAccountAndBranch));

    return {
      decodeAccountRepository,
      mockCreateRepository,
      mockGetByIdRepository,
      mockCountPendingLast24Repository,
      mockGetByDocumentAndAccountAndBranchRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not decode if missing params', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const bank = await BankFactory.create<BankEntity>(BankEntity.name);
      const personType = PersonType.NATURAL_PERSON;
      const accType = AccountType.CACC;
      const {
        sut,
        mockCreateRepository,
        mockGetByIdRepository,
        mockCountPendingLast24Repository,
        mockGetUserService,
        mockGetBankingService,
        mockGetKYCInfo,
        mockPendingDecodedPixAccountEvent,
        mockGetByDocumentAndAccountAndBranchRepository,
      } = makeSut();

      const test = [
        () => sut.execute(null, null, null, null, null, null, null, null),
        () => sut.execute(uuidV4(), null, null, null, null, null, null, null),
        () => sut.execute(null, user, null, null, null, null, null, null),
        () => sut.execute(null, null, personType, null, null, null, null, null),
        () => sut.execute(null, null, null, bank, null, null, null, null),
        () => sut.execute(null, null, null, null, '0001', null, null, null),
        () => sut.execute(null, null, null, null, null, '123456', null, null),
        () => sut.execute(null, null, null, null, null, null, accType, null),
        () => sut.execute(null, null, null, null, null, null, null, '12345678'),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockCountPendingLast24Repository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingService).toHaveBeenCalledTimes(0);
      expect(mockGetKYCInfo).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetByDocumentAndAccountAndBranchRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not decode if has conflict between person type and document', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const {
        sut,
        mockCreateRepository,
        mockGetByIdRepository,
        mockCountPendingLast24Repository,
        mockGetUserService,
        mockGetBankingService,
        mockGetKYCInfo,
        mockPendingDecodedPixAccountEvent,
        mockGetByDocumentAndAccountAndBranchRepository,
      } = makeSut();

      const decoded =
        await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
          DecodedPixAccountEntity.name,
        );

      const test = [
        () =>
          sut.execute(
            decoded.id,
            user,
            PersonType.NATURAL_PERSON,
            decoded.bank,
            decoded.branch,
            decoded.accountNumber,
            decoded.accountType,
            cnpj.generate(),
          ),
        () =>
          sut.execute(
            decoded.id,
            user,
            PersonType.LEGAL_PERSON,
            decoded.bank,
            decoded.branch,
            decoded.accountNumber,
            decoded.accountType,
            cpf.generate(),
          ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(
          DecodedPixAccountDocumentAndPersonTypeConflictException,
        );
      }
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockCountPendingLast24Repository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingService).toHaveBeenCalledTimes(0);
      expect(mockGetKYCInfo).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetByDocumentAndAccountAndBranchRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not decode if decode exist with provided id but request and decode user are different', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decoded =
        await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
          DecodedPixAccountEntity.name,
        );

      const {
        sut,
        mockCreateRepository,
        mockGetByIdRepository,
        mockCountPendingLast24Repository,
        mockGetUserService,
        mockGetBankingService,
        mockGetKYCInfo,
        mockPendingDecodedPixAccountEvent,
        mockGetByDocumentAndAccountAndBranchRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValueOnce(decoded);

      const testScript = () =>
        sut.execute(
          decoded.id,
          user,
          decoded.personType,
          decoded.bank,
          decoded.branch,
          decoded.accountNumber,
          decoded.accountType,
          decoded.document,
        );

      await expect(testScript).rejects.toThrow(ForbiddenException);

      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCountPendingLast24Repository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingService).toHaveBeenCalledTimes(0);
      expect(mockGetKYCInfo).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetByDocumentAndAccountAndBranchRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not decode if bank not found', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decoded =
        await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
          DecodedPixAccountEntity.name,
        );

      const {
        sut,
        mockCreateRepository,
        mockGetByIdRepository,
        mockCountPendingLast24Repository,
        mockGetUserService,
        mockGetBankingService,
        mockGetKYCInfo,
        mockPendingDecodedPixAccountEvent,
        mockGetByDocumentAndAccountAndBranchRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValueOnce(null);
      mockGetBankingService.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(
          decoded.id,
          user,
          decoded.personType,
          decoded.bank,
          decoded.branch,
          decoded.accountNumber,
          decoded.accountType,
          decoded.document,
        );

      await expect(testScript).rejects.toThrow(BankNotFoundException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCountPendingLast24Repository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockGetKYCInfo).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetByDocumentAndAccountAndBranchRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not decode if maximum number of daily decoding requests has been reached', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const bank = await BankFactory.create<BankEntity>(BankEntity.name);
      const decoded =
        await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
          DecodedPixAccountEntity.name,
        );

      const {
        sut,
        mockCreateRepository,
        mockGetByIdRepository,
        mockCountPendingLast24Repository,
        mockGetUserService,
        mockGetBankingService,
        mockGetKYCInfo,
        mockPendingDecodedPixAccountEvent,
        mockGetByDocumentAndAccountAndBranchRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValueOnce(null);
      mockGetBankingService.mockResolvedValueOnce(bank);
      mockCountPendingLast24Repository.mockResolvedValueOnce(10);

      const testScript = () =>
        sut.execute(
          decoded.id,
          user,
          decoded.personType,
          bank,
          decoded.branch,
          decoded.accountNumber,
          decoded.accountType,
          decoded.document,
        );

      await expect(testScript).rejects.toThrow(
        MaxDecodedPixAccountRequestsPerDayReached,
      );
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCountPendingLast24Repository).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockGetKYCInfo).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetByDocumentAndAccountAndBranchRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not decode self account', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetByIdRepository,
        mockCountPendingLast24Repository,
        mockGetUserService,
        mockGetBankingService,
        mockGetKYCInfo,
        mockPendingDecodedPixAccountEvent,
        mockGetByDocumentAndAccountAndBranchRepository,
        pixPaymentZroBankIspb,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const bank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: pixPaymentZroBankIspb,
      });
      const decoded =
        await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
          DecodedPixAccountEntity.name,
        );

      const onboarding: GetOnboardingByDocumentAndStatusIsFinishedServiceResponse =
        {
          id: uuidV4(),
          user,
          status: OnboardingStatus.FINISHED,
          fullName: user.fullName,
        };

      mockGetByIdRepository.mockResolvedValueOnce(null);
      mockGetBankingService.mockResolvedValueOnce(bank);
      mockCountPendingLast24Repository.mockResolvedValueOnce(9);
      mockGetByDocumentAndAccountAndBranchRepository.mockResolvedValueOnce(
        null,
      );
      mockGetUserService.mockResolvedValueOnce(onboarding);

      const testScript = () =>
        sut.execute(
          decoded.id,
          user,
          PersonType.NATURAL_PERSON,
          bank,
          decoded.branch,
          decoded.accountNumber,
          decoded.accountType,
          cpf.generate(),
        );

      await expect(testScript).rejects.toThrow(
        DecodedPixAccountOwnedByUserException,
      );
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCountPendingLast24Repository).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockGetKYCInfo).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetByDocumentAndAccountAndBranchRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - Should not decode if Kyc info not found', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetByIdRepository,
        mockCountPendingLast24Repository,
        mockGetUserService,
        mockGetBankingService,
        mockGetKYCInfo,
        mockPendingDecodedPixAccountEvent,
        mockGetByDocumentAndAccountAndBranchRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const bank = await BankFactory.create<BankEntity>(BankEntity.name);
      const decoded =
        await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
          DecodedPixAccountEntity.name,
        );

      mockGetByIdRepository.mockResolvedValueOnce(null);
      mockGetBankingService.mockResolvedValueOnce(bank);
      mockCountPendingLast24Repository.mockResolvedValueOnce(9);
      mockGetByDocumentAndAccountAndBranchRepository.mockResolvedValueOnce(
        null,
      );
      mockGetUserService.mockResolvedValueOnce(null);
      mockGetKYCInfo.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(
          decoded.id,
          user,
          PersonType.NATURAL_PERSON,
          bank,
          decoded.branch,
          decoded.accountNumber,
          decoded.accountType,
          cpf.generate(),
        );

      await expect(testScript).rejects.toThrow(KYCNotFoundException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCountPendingLast24Repository).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockGetKYCInfo).toHaveBeenCalledTimes(1);
      expect(mockPendingDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetByDocumentAndAccountAndBranchRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0007 - Should return already decoded by id successfully', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decoded =
        await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
          DecodedPixAccountEntity.name,
          { user },
        );

      const {
        sut,
        mockCreateRepository,
        mockGetByIdRepository,
        mockCountPendingLast24Repository,
        mockGetUserService,
        mockGetBankingService,
        mockGetKYCInfo,
        mockPendingDecodedPixAccountEvent,
        mockGetByDocumentAndAccountAndBranchRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValueOnce(decoded);

      const decodedResult = await sut.execute(
        decoded.id,
        user,
        decoded.personType,
        decoded.bank,
        decoded.branch,
        decoded.accountNumber,
        decoded.accountType,
        decoded.document,
      );

      expect(decodedResult).toBeDefined();
      expect(decodedResult.id).toBe(decoded.id);

      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCountPendingLast24Repository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingService).toHaveBeenCalledTimes(0);
      expect(mockGetKYCInfo).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetByDocumentAndAccountAndBranchRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should return database decoded found by user and account data successfully', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const bank = await BankFactory.create<BankEntity>(BankEntity.name);
      const decoded =
        await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
          DecodedPixAccountEntity.name,
          { user },
        );

      const {
        sut,
        mockCreateRepository,
        mockGetByIdRepository,
        mockCountPendingLast24Repository,
        mockGetUserService,
        mockGetBankingService,
        mockGetKYCInfo,
        mockPendingDecodedPixAccountEvent,
        mockGetByDocumentAndAccountAndBranchRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValueOnce(null);
      mockGetBankingService.mockResolvedValueOnce(bank);

      const decodedResult = await sut.execute(
        decoded.id,
        user,
        decoded.personType,
        bank,
        decoded.branch,
        decoded.accountNumber,
        decoded.accountType,
        decoded.document,
      );

      expect(decodedResult).toBeDefined();

      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCountPendingLast24Repository).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockGetKYCInfo).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixAccountEvent).toHaveBeenCalledTimes(1);
      expect(
        mockGetByDocumentAndAccountAndBranchRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should return database decoded found by user and account data successfully', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const bank = await BankFactory.create<BankEntity>(BankEntity.name);
      const decoded =
        await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
          DecodedPixAccountEntity.name,
          { user },
        );

      const {
        sut,
        mockCreateRepository,
        mockGetByIdRepository,
        mockCountPendingLast24Repository,
        mockGetUserService,
        mockGetBankingService,
        mockGetKYCInfo,
        mockPendingDecodedPixAccountEvent,
        mockGetByDocumentAndAccountAndBranchRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValueOnce(null);
      mockGetBankingService.mockResolvedValueOnce(bank);
      mockCountPendingLast24Repository.mockResolvedValueOnce(9);
      mockGetByDocumentAndAccountAndBranchRepository.mockResolvedValueOnce(
        decoded,
      );

      const decodedResult = await sut.execute(
        decoded.id,
        user,
        decoded.personType,
        bank,
        decoded.branch,
        decoded.accountNumber,
        decoded.accountType,
        decoded.document,
      );

      expect(decodedResult).toBeDefined();

      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCountPendingLast24Repository).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockGetKYCInfo).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixAccountEvent).toHaveBeenCalledTimes(1);
      expect(
        mockGetByDocumentAndAccountAndBranchRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0010 - Should return decoded using user onboarding data found', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const bank = await BankFactory.create<BankEntity>(BankEntity.name);
      const decoded =
        await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
          DecodedPixAccountEntity.name,
          { user },
        );
      const userServiceResp: GetOnboardingByDocumentAndStatusIsFinishedServiceResponse =
        {
          id: uuidV4(),
          user: new UserEntity({ uuid: uuidV4() }),
          status: OnboardingStatus.FINISHED,
          fullName: 'Joao 123',
        };

      const {
        sut,
        mockCreateRepository,
        mockGetByIdRepository,
        mockCountPendingLast24Repository,
        mockGetUserService,
        mockGetBankingService,
        mockGetKYCInfo,
        mockPendingDecodedPixAccountEvent,
        mockGetByDocumentAndAccountAndBranchRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValueOnce(null);
      mockGetBankingService.mockResolvedValueOnce(bank);
      mockCountPendingLast24Repository.mockResolvedValueOnce(9);
      mockGetByDocumentAndAccountAndBranchRepository.mockResolvedValueOnce(
        null,
      );
      mockGetUserService.mockResolvedValueOnce(userServiceResp);

      const decodedResult = await sut.execute(
        decoded.id,
        user,
        PersonType.NATURAL_PERSON,
        bank,
        decoded.branch,
        decoded.accountNumber,
        decoded.accountType,
        cpf.generate(),
      );

      expect(decodedResult).toBeDefined();

      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCountPendingLast24Repository).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockGetKYCInfo).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixAccountEvent).toHaveBeenCalledTimes(1);
      expect(
        mockGetByDocumentAndAccountAndBranchRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0011 - Should return decoded using user kyc data found', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const bank = await BankFactory.create<BankEntity>(BankEntity.name);
      const decoded =
        await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
          DecodedPixAccountEntity.name,
          { user },
        );
      const kyc: GetKycInfoResponse = {
        name: 'Joao 123',
        props: { signo: 'qualquer um', name: 'Joao 123' },
      };

      const {
        sut,
        mockCreateRepository,
        mockGetByIdRepository,
        mockCountPendingLast24Repository,
        mockGetUserService,
        mockGetBankingService,
        mockGetKYCInfo,
        mockPendingDecodedPixAccountEvent,
        mockGetByDocumentAndAccountAndBranchRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValueOnce(null);
      mockGetBankingService.mockResolvedValueOnce(bank);
      mockCountPendingLast24Repository.mockResolvedValueOnce(9);
      mockGetByDocumentAndAccountAndBranchRepository.mockResolvedValueOnce(
        null,
      );
      mockGetUserService.mockResolvedValueOnce(null);
      mockGetKYCInfo.mockResolvedValueOnce(kyc);

      const decodedResult = await sut.execute(
        decoded.id,
        user,
        PersonType.NATURAL_PERSON,
        bank,
        decoded.branch,
        decoded.accountNumber,
        decoded.accountType,
        cpf.generate(),
      );

      expect(decodedResult).toBeDefined();

      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCountPendingLast24Repository).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockGetKYCInfo).toHaveBeenCalledTimes(1);
      expect(mockPendingDecodedPixAccountEvent).toHaveBeenCalledTimes(1);
      expect(
        mockGetByDocumentAndAccountAndBranchRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
