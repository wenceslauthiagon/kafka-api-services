import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import {
  PaymentRepository,
  PixDevolutionReceivedEntity,
  PixDevolutionReceivedRepository,
} from '@zro/pix-payments/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
} from '@zro/operations/domain';
import {
  ReceivePixDevolutionReceivedUseCase as UseCase,
  OperationService,
  PixDevolutionReceivedEventEmitter,
  BankingService,
  PixDevolutionReceivedAccountNotFoundException,
  BankNotFoundException,
  PaymentNotFoundException,
  PixDevolutionReceivedBankNotAllowedException,
} from '@zro/pix-payments/application';
import { PixDevolutionReceivedFactory } from '@zro/test/pix-payments/config';
import { WalletAccountFactory } from '@zro/test/operations/config';

describe('ReceivePixDevolutionReceivedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const operationCurrencyTag = 'REAL';
    const pixDevolutionReceivedOperationTransactionTag = 'PIXDEVREC';
    const zroBankIspb = '26264220';

    const {
      devolutionReceivedRepository,
      mockCreatePixDevolutionReceivedRepository,
      mockGetPixDevolutionReceivedRepository,
      pixPaymentRepository,
      mockGetPixPaymentByIdOrEndToEndIdRepository,
    } = mockRepository();

    const { eventEmitter, mockReadyEventEmitter } = mockEmitter();

    const {
      operationService,
      mockAcceptOperationService,
      mockCreateOperationService,
      bankingService,
      mockGetBankingService,
      mockGetAccountOperationService,
    } = mockService();

    const sut = new UseCase(
      logger,
      devolutionReceivedRepository,
      pixPaymentRepository,
      eventEmitter,
      operationService,
      bankingService,
      operationCurrencyTag,
      pixDevolutionReceivedOperationTransactionTag,
      zroBankIspb,
    );
    return {
      sut,
      zroBankIspb,
      mockCreatePixDevolutionReceivedRepository,
      mockGetPixDevolutionReceivedRepository,
      mockGetPixPaymentByIdOrEndToEndIdRepository,
      mockReadyEventEmitter,
      mockAcceptOperationService,
      mockCreateOperationService,
      mockGetBankingService,
      mockGetAccountOperationService,
    };
  };

  const mockRepository = () => {
    const devolutionReceivedRepository: PixDevolutionReceivedRepository =
      createMock<PixDevolutionReceivedRepository>();
    const mockCreatePixDevolutionReceivedRepository: jest.Mock = On(
      devolutionReceivedRepository,
    ).get(method((mock) => mock.create));
    const mockGetPixDevolutionReceivedRepository: jest.Mock = On(
      devolutionReceivedRepository,
    ).get(method((mock) => mock.getById));

    const pixPaymentRepository: PaymentRepository =
      createMock<PaymentRepository>();
    const mockGetPixPaymentByIdOrEndToEndIdRepository: jest.Mock = On(
      pixPaymentRepository,
    ).get(method((mock) => mock.getByIdOrEndToEndId));

    return {
      devolutionReceivedRepository,
      mockCreatePixDevolutionReceivedRepository,
      mockGetPixDevolutionReceivedRepository,
      pixPaymentRepository,
      mockGetPixPaymentByIdOrEndToEndIdRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixDevolutionReceivedEventEmitter =
      createMock<PixDevolutionReceivedEventEmitter>();
    const mockReadyEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.readyDevolutionReceived),
    );

    return {
      eventEmitter,
      mockReadyEventEmitter,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockCreateOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.createOperation),
    );
    const mockAcceptOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.acceptOperation),
    );
    const mockGetAccountOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.getWalletAccountByAccountNumberAndCurrency),
    );

    const bankingService: BankingService = createMock<BankingService>();
    const mockGetBankingService: jest.Mock = On(bankingService).get(
      method((mock) => mock.getBankByIspb),
    );

    return {
      operationService,
      mockAcceptOperationService,
      mockCreateOperationService,
      mockGetAccountOperationService,
      bankingService,
      mockGetBankingService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create new devolution received when id is null', async () => {
      const { sut } = makeSut();

      const data =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );

      const testScript = () =>
        sut.execute(
          null,
          data.payment,
          data.amount,
          data.txId,
          data.endToEndId,
          data.clientBank,
          data.clientBranch,
          data.clientAccountNumber,
          data.clientDocument,
          data.clientName,
          data.clientKey,
          data.thirdPartBank,
          data.thirdPartBranch,
          data.thirdPartAccountType,
          data.thirdPartAccountNumber,
          data.thirdPartDocument,
          data.thirdPartName,
          data.thirdPartKey,
          data.description,
        );

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    it('TC0002 - Should not create if devolution received already exists', async () => {
      const { sut, mockGetPixDevolutionReceivedRepository } = makeSut();

      const data =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );

      mockGetPixDevolutionReceivedRepository.mockResolvedValue(data);

      const result = await sut.execute(
        data.id,
        data.payment,
        data.amount,
        data.txId,
        data.endToEndId,
        data.clientBank,
        data.clientBranch,
        data.clientAccountNumber,
        data.clientDocument,
        data.clientName,
        data.clientKey,
        data.thirdPartBank,
        data.thirdPartBranch,
        data.thirdPartAccountType,
        data.thirdPartAccountNumber,
        data.thirdPartDocument,
        data.thirdPartName,
        data.thirdPartKey,
        data.description,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject(data);
      expect(mockGetPixDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not create new devolution received when it is not headed to Zrobank', async () => {
      const { sut, mockGetPixDevolutionReceivedRepository } = makeSut();

      const data =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );

      mockGetPixDevolutionReceivedRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(
          data.id,
          data.payment,
          data.amount,
          data.txId,
          data.endToEndId,
          data.clientBank,
          data.clientBranch,
          data.clientAccountNumber,
          data.clientDocument,
          data.clientName,
          data.clientKey,
          data.thirdPartBank,
          data.thirdPartBranch,
          data.thirdPartAccountType,
          data.thirdPartAccountNumber,
          data.thirdPartDocument,
          data.thirdPartName,
          data.thirdPartKey,
          data.description,
        );

      await expect(testScript).rejects.toThrow(
        PixDevolutionReceivedBankNotAllowedException,
      );
      expect(mockGetPixDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should not create when thirdpart bank is not found', async () => {
      const {
        sut,
        zroBankIspb,
        mockGetPixDevolutionReceivedRepository,
        mockGetBankingService,
      } = makeSut();

      const data =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          { clientBank: new BankEntity({ ispb: zroBankIspb }) },
        );

      mockGetPixDevolutionReceivedRepository.mockResolvedValue(null);
      mockGetBankingService
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(
          data.id,
          data.payment,
          data.amount,
          data.txId,
          data.endToEndId,
          data.clientBank,
          data.clientBranch,
          data.clientAccountNumber,
          data.clientDocument,
          data.clientName,
          data.clientKey,
          data.thirdPartBank,
          data.thirdPartBranch,
          data.thirdPartAccountType,
          data.thirdPartAccountNumber,
          data.thirdPartDocument,
          data.thirdPartName,
          data.thirdPartKey,
          data.description,
        );

      await expect(testScript).rejects.toThrow(BankNotFoundException);
      expect(mockGetPixDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(2);
    });

    it('TC0005 - Should not create when transactionOriginalId (payment) is not found', async () => {
      const {
        sut,
        zroBankIspb,
        mockGetBankingService,
        mockGetPixDevolutionReceivedRepository,
        mockGetPixPaymentByIdOrEndToEndIdRepository,
      } = makeSut();

      const data =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          { clientBank: new BankEntity({ ispb: zroBankIspb }) },
        );

      mockGetPixDevolutionReceivedRepository.mockResolvedValue(null);
      mockGetBankingService.mockResolvedValue({});
      mockGetPixPaymentByIdOrEndToEndIdRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(
          data.id,
          data.payment,
          data.amount,
          data.txId,
          data.endToEndId,
          data.clientBank,
          data.clientBranch,
          data.clientAccountNumber,
          data.clientDocument,
          data.clientName,
          data.clientKey,
          data.thirdPartBank,
          data.thirdPartBranch,
          data.thirdPartAccountType,
          data.thirdPartAccountNumber,
          data.thirdPartDocument,
          data.thirdPartName,
          data.thirdPartKey,
          data.description,
        );

      await expect(testScript).rejects.toThrow(PaymentNotFoundException);
      expect(mockGetPixDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(2);
      expect(mockGetPixPaymentByIdOrEndToEndIdRepository).toHaveBeenCalledTimes(
        1,
      );
    });

    it('TC0006 - Should not create new devolution received when account is not found', async () => {
      const {
        sut,
        zroBankIspb,
        mockGetBankingService,
        mockGetAccountOperationService,
        mockGetPixPaymentByIdOrEndToEndIdRepository,
        mockGetPixDevolutionReceivedRepository,
      } = makeSut();

      const data =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          { clientBank: new BankEntity({ ispb: zroBankIspb }) },
        );

      mockGetPixDevolutionReceivedRepository.mockResolvedValue(null);
      mockGetBankingService.mockResolvedValue({});
      mockGetPixPaymentByIdOrEndToEndIdRepository.mockResolvedValue({});
      mockGetAccountOperationService.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(
          data.id,
          data.payment,
          data.amount,
          data.txId,
          data.endToEndId,
          data.clientBank,
          data.clientBranch,
          data.clientAccountNumber,
          data.clientDocument,
          data.clientName,
          data.clientKey,
          data.thirdPartBank,
          data.thirdPartBranch,
          data.thirdPartAccountType,
          data.thirdPartAccountNumber,
          data.thirdPartDocument,
          data.thirdPartName,
          data.thirdPartKey,
          data.description,
        );

      await expect(testScript).rejects.toThrow(
        PixDevolutionReceivedAccountNotFoundException,
      );
      expect(mockGetPixDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(2);
      expect(mockGetPixPaymentByIdOrEndToEndIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetAccountOperationService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0007 - Should create new devolution received, create and accept operation', async () => {
      const {
        sut,
        zroBankIspb,
        mockGetAccountOperationService,
        mockGetBankingService,
        mockReadyEventEmitter,
        mockGetPixDevolutionReceivedRepository,
        mockGetPixPaymentByIdOrEndToEndIdRepository,
        mockCreatePixDevolutionReceivedRepository,
      } = makeSut();

      const clientBank = new BankEntity({ ispb: zroBankIspb });
      const data =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          { clientBank },
        );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      mockGetPixDevolutionReceivedRepository.mockResolvedValue(null);
      mockGetPixPaymentByIdOrEndToEndIdRepository.mockResolvedValue({});
      mockGetAccountOperationService.mockResolvedValue(walletAccount);
      mockGetBankingService.mockResolvedValue(clientBank);
      mockCreatePixDevolutionReceivedRepository.mockImplementation(
        (body) => body,
      );

      const result = await sut.execute(
        data.id,
        data.payment,
        data.amount,
        data.txId,
        data.endToEndId,
        data.clientBank,
        data.clientBranch,
        data.clientAccountNumber,
        data.clientDocument,
        data.clientName,
        data.clientKey,
        data.thirdPartBank,
        data.thirdPartBranch,
        data.thirdPartAccountType,
        data.thirdPartAccountNumber,
        data.thirdPartDocument,
        data.thirdPartName,
        data.thirdPartKey,
        data.description,
      );

      expect(result).toBeDefined();
      expect(mockGetPixDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(2);
      expect(mockGetPixPaymentByIdOrEndToEndIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetAccountOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreatePixDevolutionReceivedRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyEventEmitter).toHaveBeenCalledTimes(1);
    });
  });
});
