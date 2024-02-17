import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  BankAccountEntity,
  ClientEntity,
  CompanyEntity,
  PlanEntity,
  PlanRepository,
  QrCodeEntity,
  TransactionEntity,
  TransactionRepository,
} from '@zro/pix-zro-pay/domain';
import {
  PlanNotFoundException,
  HandleCreateTransactionQrCodeEventUseCase as UseCase,
} from '@zro/pix-zro-pay/application';
import {
  BankAccountFactory,
  ClientFactory,
  CompanyFactory,
  PlanFactory,
} from '@zro/test/pix-zro-pay/config';
import { QrCodeFactory } from '@zro/test/pix-zro-pay/config/factories/qr_code.factory';
import { TransactionFactory } from '@zro/test/pix-zro-pay/config/factories/transaction.factory';

describe('HandleCreateTransactionQrCodeEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = async () => {
    const {
      transactionRepository,
      mockGetTransactionRepository,
      planRepository,
      mockGetPlanRepository,
      mockCreateTransactionRepository,
    } = mockRepository();
    const { company, qrCode, transaction, plan } = await mockModel();

    const sut = new UseCase(logger, transactionRepository, planRepository);
    return {
      sut,
      transactionRepository,
      mockGetTransactionRepository,
      planRepository,
      mockGetPlanRepository,
      mockCreateTransactionRepository,
      company,
      qrCode,
      transaction,
      plan,
    };
  };

  const mockRepository = () => {
    const transactionRepository: TransactionRepository =
      createMock<TransactionRepository>();
    const mockGetTransactionRepository: jest.Mock = On(
      transactionRepository,
    ).get(method((mock) => mock.getByUuid));
    const mockCreateTransactionRepository: jest.Mock = On(
      transactionRepository,
    ).get(method((mock) => mock.create));
    const planRepository: PlanRepository = createMock<PlanRepository>();
    const mockGetPlanRepository: jest.Mock = On(planRepository).get(
      method((mock) => mock.getById),
    );

    return {
      transactionRepository,
      mockGetTransactionRepository,
      planRepository,
      mockGetPlanRepository,
      mockCreateTransactionRepository,
    };
  };

  const mockModel = async () => {
    const bankAccount = await BankAccountFactory.create<BankAccountEntity>(
      BankAccountEntity.name,
    );
    const client = await ClientFactory.create<ClientEntity>(ClientEntity.name);
    const plan = await PlanFactory.create<PlanEntity>(PlanEntity.name);
    const company = await CompanyFactory.create<CompanyEntity>(
      CompanyEntity.name,
      { plan },
    );

    const qrCode = await QrCodeFactory.create<QrCodeEntity>(QrCodeEntity.name, {
      company,
      bankAccount,
      client,
    });

    const transaction = await TransactionFactory.create<TransactionEntity>(
      TransactionEntity.name,
      { company },
    );

    return { company, qrCode, transaction, plan };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get if missing params', async () => {
      const {
        sut,
        qrCode,
        mockGetTransactionRepository,
        mockGetPlanRepository,
        mockCreateTransactionRepository,
      } = await makeSut();

      qrCode.company = null;
      qrCode.transactionUuid = null;

      const testScript = () => sut.execute(qrCode);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetTransactionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateTransactionRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw error when plan is not found', async () => {
      const {
        sut,
        qrCode,
        mockGetTransactionRepository,
        mockGetPlanRepository,
        mockCreateTransactionRepository,
      } = await makeSut();

      mockGetTransactionRepository.mockResolvedValue(undefined);
      mockGetPlanRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(qrCode);

      await expect(testScript).rejects.toThrow(PlanNotFoundException);
      expect(mockGetTransactionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateTransactionRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should get transaction successfully when exists transaction', async () => {
      const {
        sut,
        mockGetTransactionRepository,
        mockCreateTransactionRepository,
        mockGetPlanRepository,
        transaction,
        qrCode,
      } = await makeSut();

      mockGetTransactionRepository.mockResolvedValue(transaction);

      const result = await sut.execute(qrCode);

      expect(result).toBeDefined();
      expect(result).toEqual(transaction);
      expect(mockGetTransactionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateTransactionRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should create transaction successfully when not exists transction', async () => {
      const {
        sut,
        mockGetTransactionRepository,
        mockCreateTransactionRepository,
        mockGetPlanRepository,
        plan,
        qrCode,
        transaction,
      } = await makeSut();

      mockGetTransactionRepository.mockResolvedValue(undefined);
      mockGetPlanRepository.mockResolvedValue(plan);

      const result = await sut.execute(qrCode);

      expect(result).toBeDefined();
      expect(result.paymentType).toEqual(transaction.paymentType);
      expect(result.valueCents).toEqual(qrCode.value);
      expect(result.feeValue).toBeDefined();
      expect(result.feeInPercent).toBeDefined();
      expect(result.totalFee).toBeDefined();
      expect(result.client).toBeDefined();
      expect(result.status).toEqual(transaction.status);
      expect(result.bankAccount).toBeDefined();
      expect(result.company).toBeDefined();
      expect(result.pixKey).toBeDefined();
      expect(result.pixKeyType).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.transactionType).toBeDefined();
      expect(result.referenceId).toBeDefined();
      expect(result.uuid).toBeDefined();
      expect(result.merchantId).toBeDefined();
      expect(result.zroTotalValueInCents).toBeDefined();
      expect(result.mainCompanyTotalFeeCents).toBeDefined();
      expect(result.processStatus).toEqual(transaction.processStatus);
      expect(mockGetTransactionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateTransactionRepository).toHaveBeenCalledTimes(1);
    });
  });
});
