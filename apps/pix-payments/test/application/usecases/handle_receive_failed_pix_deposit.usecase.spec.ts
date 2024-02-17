import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import {
  PixDepositEntity,
  PixDepositRepository,
} from '@zro/pix-payments/domain';
import {
  HandleReceiveFailedPixDepositEventUseCase as UseCase,
  PixDepositEventEmitter,
  BankingService,
  PixDepositReceivedBankNotAllowedException,
  PixDevolutionEventEmitter,
  UserService,
} from '@zro/pix-payments/application';
import { PixDepositFactory } from '@zro/test/pix-payments/config';
import { BankFactory } from '@zro/test/banking/config';

describe('HandleReceiveFailedPixDepositEventUseCase', () => {
  const makeSut = () => {
    const pixDepositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetByIdDepositRepository: jest.Mock = On(
      pixDepositRepository,
    ).get(method((mock) => mock.getById));
    const mockCreateDepositRepository: jest.Mock = On(pixDepositRepository).get(
      method((mock) => mock.create),
    );

    const pixDepositEventEmitter: PixDepositEventEmitter =
      createMock<PixDepositEventEmitter>();
    const mockReceivedFailedDepositEvent: jest.Mock = On(
      pixDepositEventEmitter,
    ).get(method((mock) => mock.receivedFailedDeposit));

    const pixDevolutionEventEmitter: PixDevolutionEventEmitter =
      createMock<PixDevolutionEventEmitter>();
    const mockCreateFailedPixDevolutionEvent: jest.Mock = On(
      pixDevolutionEventEmitter,
    ).get(method((mock) => mock.createFailedPixDevolution));

    const bankingService: BankingService = createMock<BankingService>();
    const mockGetBankByIspb: jest.Mock = On(bankingService).get(
      method((mock) => mock.getBankByIspb),
    );

    const userService: UserService = createMock<UserService>();
    const mockGetUserByDocument: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByDocument),
    );

    const operationReceivedPixDepositTransactionTag = 'PIXREC';
    const zroBankIspb = 'ZROBANK';

    const sut = new UseCase(
      logger,
      pixDepositRepository,
      pixDepositEventEmitter,
      pixDevolutionEventEmitter,
      bankingService,
      userService,
      operationReceivedPixDepositTransactionTag,
      zroBankIspb,
    );

    return {
      sut,
      mockGetByIdDepositRepository,
      mockCreateDepositRepository,
      mockReceivedFailedDepositEvent,
      mockCreateFailedPixDevolutionEvent,
      mockGetBankByIspb,
      mockGetUserByDocument,
    };
  };

  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params', async () => {
      const {
        sut,
        mockGetByIdDepositRepository,
        mockCreateDepositRepository,
        mockReceivedFailedDepositEvent,
        mockCreateFailedPixDevolutionEvent,
        mockGetBankByIspb,
        mockGetUserByDocument,
      } = makeSut();

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      const testScripts = [
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
            null,
            null,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
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
          ),
        () =>
          sut.execute(
            data.id,
            data.amount,
            data.txId,
            data.endToEndId,
            null,
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
          ),
        () =>
          sut.execute(
            data.id,
            data.amount,
            data.txId,
            data.endToEndId,
            data.clientBank,
            null,
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
          ),
        () =>
          sut.execute(
            data.id,
            data.amount,
            data.txId,
            data.endToEndId,
            data.clientBank,
            data.clientBranch,
            null,
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
          ),
        () =>
          sut.execute(
            data.id,
            data.amount,
            data.txId,
            data.endToEndId,
            data.clientBank,
            data.clientBranch,
            data.clientAccountNumber,
            null,
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
          ),
        () =>
          sut.execute(
            data.id,
            data.amount,
            data.txId,
            data.endToEndId,
            data.clientBank,
            data.clientBranch,
            data.clientAccountNumber,
            data.clientDocument,
            data.clientName,
            data.clientKey,
            null,
            data.thirdPartBranch,
            data.thirdPartAccountType,
            data.thirdPartAccountNumber,
            data.thirdPartDocument,
            data.thirdPartName,
            data.thirdPartKey,
            data.description,
          ),
        () =>
          sut.execute(
            data.id,
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
            null,
            data.thirdPartDocument,
            data.thirdPartName,
            data.thirdPartKey,
            data.description,
          ),
        () =>
          sut.execute(
            data.id,
            null,
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
          ),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
      }
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivedFailedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateFailedPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockGetBankByIspb).toHaveBeenCalledTimes(0);
      expect(mockGetUserByDocument).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should return deposit if it already exists', async () => {
      const {
        sut,
        mockGetByIdDepositRepository,
        mockCreateDepositRepository,
        mockReceivedFailedDepositEvent,
        mockCreateFailedPixDevolutionEvent,
        mockGetBankByIspb,
        mockGetUserByDocument,
      } = makeSut();

      const checkDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetByIdDepositRepository.mockResolvedValueOnce(checkDeposit);

      await sut.execute(
        checkDeposit.id,
        checkDeposit.amount,
        checkDeposit.txId,
        checkDeposit.endToEndId,
        checkDeposit.clientBank,
        checkDeposit.clientBranch,
        checkDeposit.clientAccountNumber,
        checkDeposit.clientDocument,
        checkDeposit.clientName,
        checkDeposit.clientKey,
        checkDeposit.thirdPartBank,
        checkDeposit.thirdPartBranch,
        checkDeposit.thirdPartAccountType,
        checkDeposit.thirdPartAccountNumber,
        checkDeposit.thirdPartDocument,
        checkDeposit.thirdPartName,
        checkDeposit.thirdPartKey,
        checkDeposit.description,
      );

      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivedFailedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateFailedPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockGetBankByIspb).toHaveBeenCalledTimes(0);
      expect(mockGetUserByDocument).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixDepositReceivedBankNotAllowedException if client bank is not from zro.', async () => {
      const {
        sut,
        mockGetByIdDepositRepository,
        mockCreateDepositRepository,
        mockReceivedFailedDepositEvent,
        mockCreateFailedPixDevolutionEvent,
        mockGetBankByIspb,
        mockGetUserByDocument,
      } = makeSut();

      const checkDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          clientBank: new BankEntity({
            ispb: 'INVALID BANK',
          }),
        },
      );

      mockGetByIdDepositRepository.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(
          checkDeposit.id,
          checkDeposit.amount,
          checkDeposit.txId,
          checkDeposit.endToEndId,
          checkDeposit.clientBank,
          checkDeposit.clientBranch,
          checkDeposit.clientAccountNumber,
          checkDeposit.clientDocument,
          checkDeposit.clientName,
          checkDeposit.clientKey,
          checkDeposit.thirdPartBank,
          checkDeposit.thirdPartBranch,
          checkDeposit.thirdPartAccountType,
          checkDeposit.thirdPartAccountNumber,
          checkDeposit.thirdPartDocument,
          checkDeposit.thirdPartName,
          checkDeposit.thirdPartKey,
          checkDeposit.description,
        );

      await expect(testScript).rejects.toThrow(
        PixDepositReceivedBankNotAllowedException,
      );
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivedFailedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateFailedPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockGetBankByIspb).toHaveBeenCalledTimes(0);
      expect(mockGetUserByDocument).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should create failed pix deposit successfully.', async () => {
      const {
        sut,
        mockGetByIdDepositRepository,
        mockCreateDepositRepository,
        mockReceivedFailedDepositEvent,
        mockCreateFailedPixDevolutionEvent,
        mockGetBankByIspb,
        mockGetUserByDocument,
      } = makeSut();

      const clientBank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: 'ZROBANK',
      });

      const checkDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          clientBank,
        },
      );

      mockGetByIdDepositRepository.mockResolvedValueOnce(null);
      mockGetBankByIspb.mockResolvedValueOnce(clientBank);

      await sut.execute(
        checkDeposit.id,
        checkDeposit.amount,
        checkDeposit.txId,
        checkDeposit.endToEndId,
        checkDeposit.clientBank,
        checkDeposit.clientBranch,
        checkDeposit.clientAccountNumber,
        checkDeposit.clientDocument,
        checkDeposit.clientName,
        checkDeposit.clientKey,
        checkDeposit.thirdPartBank,
        checkDeposit.thirdPartBranch,
        checkDeposit.thirdPartAccountType,
        checkDeposit.thirdPartAccountNumber,
        checkDeposit.thirdPartDocument,
        checkDeposit.thirdPartName,
        checkDeposit.thirdPartKey,
        checkDeposit.description,
      );

      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockReceivedFailedDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateFailedPixDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockGetBankByIspb).toHaveBeenCalledTimes(2);
      expect(mockGetUserByDocument).toHaveBeenCalledTimes(1);
    });
  });
});
