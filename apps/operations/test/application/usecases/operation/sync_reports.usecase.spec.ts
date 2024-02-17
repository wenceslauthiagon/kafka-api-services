import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, getMoment } from '@zro/common';
import {
  CurrencyEntity,
  CurrencyRepository,
  OperationEntity,
  OperationRepository,
  WalletAccountRepository,
} from '@zro/operations/domain';
import {
  ReportService,
  SyncOperationsReportsUseCase as UseCase,
  UserService,
} from '@zro/operations/application';
import { CurrencyFactory, OperationFactory } from '@zro/test/operations/config';
import { OperationType } from '@zro/reports/domain';

describe('SyncOperationsReportsUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const operationRepository: OperationRepository =
      createMock<OperationRepository>();
    const mockGetAllByFilterGenerator: jest.Mock = On(operationRepository).get(
      method((mock) => mock.getAllByFilterGenerator),
    );

    const currencyRepository: CurrencyRepository =
      createMock<CurrencyRepository>();
    const mockGetBySymbol: jest.Mock = On(currencyRepository).get(
      method((mock) => mock.getBySymbol),
    );

    const walletAccountRepository: WalletAccountRepository =
      createMock<WalletAccountRepository>();
    const mockGetWalletAccountByUserAndCurrency: jest.Mock = On(
      walletAccountRepository,
    ).get(method((mock) => mock.getByUserAndCurrency));

    return {
      operationRepository,
      mockGetAllByFilterGenerator,
      currencyRepository,
      mockGetBySymbol,
      walletAccountRepository,
      mockGetWalletAccountByUserAndCurrency,
    };
  };

  const mockService = () => {
    const userService: UserService = createMock<UserService>();
    const mockGetUserById: jest.Mock = On(userService).get(
      method((mock) => mock.getUserById),
    );

    const reportService: ReportService = createMock<ReportService>();
    const mockCreateReport: jest.Mock = On(reportService).get(
      method((mock) => mock.createOperationReport),
    );

    return {
      userService,
      mockGetUserById,
      reportService,
      mockCreateReport,
    };
  };

  const makeSut = () => {
    const {
      operationRepository,
      mockGetAllByFilterGenerator,
      currencyRepository,
      mockGetBySymbol,
      walletAccountRepository,
      mockGetWalletAccountByUserAndCurrency,
    } = mockRepository();

    const { userService, mockGetUserById, reportService, mockCreateReport } =
      mockService();

    const sut = new UseCase(
      logger,
      operationRepository,
      currencyRepository,
      walletAccountRepository,
      reportService,
      userService,
      'TESTE',
      '00001',
      'TST',
    );

    return {
      sut,
      mockGetAllByFilterGenerator,
      mockGetUserById,
      mockGetWalletAccountByUserAndCurrency,
      mockCreateReport,
      mockGetBySymbol,
    };
  };

  describe('Owner operations', () => {
    it('TC0001 - Should create owner report', async () => {
      const {
        sut,
        mockGetAllByFilterGenerator,
        mockGetUserById,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateReport,
        mockGetBySymbol,
      } = makeSut();

      const beginningOfDay = getMoment()
        .subtract(1, 'days')
        .startOf('day')
        .toDate();
      const endOfDay = getMoment().subtract(1, 'days').endOf('day').toDate();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { beneficiary: null, currency },
      );

      mockGetBySymbol.mockResolvedValue(currency);
      mockGetAllByFilterGenerator.mockImplementation(async function* () {
        yield await Promise.resolve([operation]);
      });
      mockGetUserById.mockResolvedValue(operation.owner);
      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(
        operation.ownerWalletAccount,
      );

      await sut.execute({
        createdAtStart: beginningOfDay,
        createdAtEnd: endOfDay,
      });

      expect(mockGetAllByFilterGenerator).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterGenerator).toHaveBeenCalledWith({
        transactionTag: 'TESTE',
        createdAtStart: beginningOfDay,
        createdAtEnd: endOfDay,
        currencyId: currency.id,
        nonChargeback: true,
      });
      expect(mockGetUserById).toHaveBeenCalledTimes(1);
      expect(mockGetUserById).toHaveBeenCalledWith(operation.owner.id);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledWith(
        operation.owner,
        currency,
      );
      expect(mockCreateReport).toHaveBeenCalledTimes(1);
      expect(mockCreateReport).toHaveBeenCalledWith(
        expect.objectContaining({ operationType: OperationType.D }),
      );
      expect(mockGetBySymbol).toHaveBeenCalledTimes(1);
    });
  });

  describe('Beneficiary operations', () => {
    it('TC0002 - Should create beneficiary report', async () => {
      const {
        sut,
        mockGetAllByFilterGenerator,
        mockGetUserById,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateReport,
        mockGetBySymbol,
      } = makeSut();

      const beginningOfDay = getMoment()
        .subtract(1, 'days')
        .startOf('day')
        .toDate();
      const endOfDay = getMoment().subtract(1, 'days').endOf('day').toDate();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { owner: null, currency },
      );

      mockGetBySymbol.mockResolvedValue(currency);
      mockGetAllByFilterGenerator.mockImplementation(async function* () {
        yield await Promise.resolve([operation]);
      });
      mockGetUserById.mockResolvedValue(operation.beneficiary);
      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(
        operation.beneficiaryWalletAccount,
      );

      await sut.execute({
        createdAtStart: beginningOfDay,
        createdAtEnd: endOfDay,
      });

      expect(mockGetAllByFilterGenerator).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterGenerator).toHaveBeenCalledWith({
        transactionTag: 'TESTE',
        createdAtStart: beginningOfDay,
        createdAtEnd: endOfDay,
        currencyId: currency.id,
        nonChargeback: true,
      });
      expect(mockGetUserById).toHaveBeenCalledTimes(1);
      expect(mockGetUserById).toHaveBeenCalledWith(operation.beneficiary.id);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledWith(
        operation.beneficiary,
        currency,
      );
      expect(mockCreateReport).toHaveBeenCalledTimes(1);
      expect(mockCreateReport).toHaveBeenCalledWith(
        expect.objectContaining({ operationType: OperationType.C }),
      );
      expect(mockGetBySymbol).toHaveBeenCalledTimes(1);
    });
  });

  describe('Both operations', () => {
    it('TC0003 - Should create both report', async () => {
      const {
        sut,
        mockGetAllByFilterGenerator,
        mockGetUserById,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateReport,
        mockGetBySymbol,
      } = makeSut();

      const beginningOfDay = getMoment()
        .subtract(1, 'days')
        .startOf('day')
        .toDate();
      const endOfDay = getMoment().subtract(1, 'days').endOf('day').toDate();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { currency },
      );

      mockGetBySymbol.mockResolvedValue(currency);
      mockGetAllByFilterGenerator.mockImplementation(async function* () {
        yield await Promise.resolve([operation]);
      });
      mockGetUserById.mockResolvedValueOnce(operation.owner);
      mockGetUserById.mockResolvedValue(operation.beneficiary);
      mockGetWalletAccountByUserAndCurrency.mockResolvedValueOnce(
        operation.ownerWalletAccount,
      );
      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(
        operation.beneficiaryWalletAccount,
      );

      await sut.execute({
        createdAtStart: beginningOfDay,
        createdAtEnd: endOfDay,
      });

      expect(mockGetAllByFilterGenerator).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterGenerator).toHaveBeenCalledWith({
        transactionTag: 'TESTE',
        createdAtStart: beginningOfDay,
        createdAtEnd: endOfDay,
        currencyId: currency.id,
        nonChargeback: true,
      });
      expect(mockGetUserById).toHaveBeenCalledTimes(2);
      expect(mockGetUserById).toHaveBeenNthCalledWith(1, operation.owner.id);
      expect(mockGetUserById).toHaveBeenNthCalledWith(
        2,
        operation.beneficiary.id,
      );
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(2);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenNthCalledWith(
        1,
        operation.owner,
        currency,
      );
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenNthCalledWith(
        2,
        operation.beneficiary,
        currency,
      );
      expect(mockCreateReport).toHaveBeenCalledTimes(2);
      expect(mockCreateReport).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ operationType: OperationType.D }),
      );
      expect(mockCreateReport).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ operationType: OperationType.C }),
      );
      expect(mockGetBySymbol).toHaveBeenCalledTimes(1);
    });
  });
});
