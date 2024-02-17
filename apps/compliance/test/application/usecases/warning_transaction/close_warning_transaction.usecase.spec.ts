import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity } from '@zro/operations/domain';
import {
  WarningTransactionAnalysisResultType,
  WarningTransactionEntity,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import {
  CloseWarningTransactionUseCase as UseCase,
  PixPaymentService,
  WarningTransactionEventEmitter,
  WarningTransactionInvalidStatusException,
  WarningTransactionNotFoundException,
} from '@zro/compliance/application';
import { WarningTransactionFactory } from '@zro/test/compliance/config';
import { UserFactory } from '@zro/test/users/config';

describe('CloseWarningTransactionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const warningTransactionRepository: WarningTransactionRepository =
      createMock<WarningTransactionRepository>();
    const mockGetByOperation: jest.Mock = On(warningTransactionRepository).get(
      method((mock) => mock.getByOperation),
    );
    const mockUpdate: jest.Mock = On(warningTransactionRepository).get(
      method((mock) => mock.update),
    );

    const warningTransactionEventEmitter: WarningTransactionEventEmitter =
      createMock<WarningTransactionEventEmitter>();
    const mockClosedWarningTransaction: jest.Mock = On(
      warningTransactionEventEmitter,
    ).get(method((mock) => mock.closedWarningTransaction));

    const pixPaymentService: PixPaymentService =
      createMock<PixPaymentService>();
    const mockApprovePixDeposit: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.approvePixDeposit),
    );
    const mockBlockPixDeposit: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.blockPixDeposit),
    );

    const sut = new UseCase(
      warningTransactionRepository,
      warningTransactionEventEmitter,
      pixPaymentService,
      logger,
    );
    return {
      sut,
      mockGetByOperation,
      mockUpdate,
      mockClosedWarningTransaction,
      mockApprovePixDeposit,
      mockBlockPixDeposit,
    };
  };

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when there are missing params', async () => {
      const {
        sut,
        mockGetByOperation,
        mockUpdate,
        mockClosedWarningTransaction,
        mockApprovePixDeposit,
        mockBlockPixDeposit,
      } = makeSut();

      const warningTransactions = [
        null,
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          {
            operation: new OperationEntity({
              id: null,
              beneficiary: await UserFactory.create<UserEntity>(
                UserEntity.name,
              ),
            }),
            analysisResult: WarningTransactionAnalysisResultType.APPROVED,
          },
        ),
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          {
            operation: new OperationEntity({
              id: faker.datatype.uuid(),
            }),
            analysisResult: null,
          },
        ),
      ];

      for (const warningTransaction of warningTransactions) {
        const testScript = () => sut.execute(warningTransaction);
        await expect(testScript).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockClosedWarningTransaction).toHaveBeenCalledTimes(0);
      expect(mockApprovePixDeposit).toHaveBeenCalledTimes(0);
      expect(mockBlockPixDeposit).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw WarningTransactionNotFoundException if warning transaction is not found', async () => {
      const {
        sut,
        mockGetByOperation,
        mockUpdate,
        mockClosedWarningTransaction,
        mockApprovePixDeposit,
        mockBlockPixDeposit,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          {
            analysisResult: WarningTransactionAnalysisResultType.APPROVED,
          },
        );

      mockGetByOperation.mockResolvedValue(null);

      const testScript = () => sut.execute(warningTransaction);

      await expect(testScript).rejects.toThrow(
        WarningTransactionNotFoundException,
      );

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockClosedWarningTransaction).toHaveBeenCalledTimes(0);
      expect(mockApprovePixDeposit).toHaveBeenCalledTimes(0);
      expect(mockBlockPixDeposit).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw WarningTransactionInvalidStatusException when status is already closed', async () => {
      const {
        sut,
        mockGetByOperation,
        mockUpdate,
        mockClosedWarningTransaction,
        mockApprovePixDeposit,
        mockBlockPixDeposit,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          {
            analysisResult: WarningTransactionAnalysisResultType.APPROVED,
            status: WarningTransactionStatus.CLOSED,
          },
        );

      mockGetByOperation.mockResolvedValue(warningTransaction);

      const testScript = () => sut.execute(warningTransaction);

      await expect(testScript).rejects.toThrow(
        WarningTransactionInvalidStatusException,
      );

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockClosedWarningTransaction).toHaveBeenCalledTimes(0);
      expect(mockApprovePixDeposit).toHaveBeenCalledTimes(0);
      expect(mockBlockPixDeposit).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should close approved Warning Transaction successfully and block pix deposit', async () => {
      const {
        sut,
        mockGetByOperation,
        mockUpdate,
        mockClosedWarningTransaction,
        mockApprovePixDeposit,
        mockBlockPixDeposit,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          {
            analysisResult: WarningTransactionAnalysisResultType.APPROVED,
          },
        );

      mockGetByOperation.mockResolvedValue(warningTransaction);

      await sut.execute(warningTransaction);

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockClosedWarningTransaction).toHaveBeenCalledTimes(1);
      expect(mockApprovePixDeposit).toHaveBeenCalledTimes(0);
      expect(mockBlockPixDeposit).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should close rejected Warning Transaction successfully and approve pix deposit', async () => {
      const {
        sut,
        mockGetByOperation,
        mockUpdate,
        mockClosedWarningTransaction,
        mockApprovePixDeposit,
        mockBlockPixDeposit,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          {
            analysisResult: WarningTransactionAnalysisResultType.REJECTED,
          },
        );

      mockGetByOperation.mockResolvedValue(warningTransaction);

      await sut.execute(warningTransaction);

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockClosedWarningTransaction).toHaveBeenCalledTimes(1);
      expect(mockApprovePixDeposit).toHaveBeenCalledTimes(1);
      expect(mockBlockPixDeposit).toHaveBeenCalledTimes(0);
    });
  });
});
