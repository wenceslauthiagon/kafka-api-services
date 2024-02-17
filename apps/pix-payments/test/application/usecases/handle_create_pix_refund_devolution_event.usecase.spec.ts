import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositEntity,
  PixDepositRepository,
  PixDevolutionReceivedEntity,
  PixDevolutionReceivedRepository,
  PixDevolutionCode,
  PixRefundDevolutionEntity,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  PixRefundDevolutionTransactionType,
  PixRefundEntity,
  PixRefundRepository,
  PixRefundTransactionType,
  PixInfractionRefundOperationRepository,
  PixInfractionRefundOperationEntity,
} from '@zro/pix-payments/domain';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity } from '@zro/operations/domain';
import {
  HandleCreatePixRefundDevolutionEventUseCase as UseCase,
  PixRefundDevolutionAmountOverflowException,
  PixRefundDevolutionEventEmitter,
  PixRefundDevolutionMaxNumberException,
  PixRefundNotFoundException,
  PixRefundTransactionExpiredDevolutionTimeException,
  PixTransactionNotFoundException,
} from '@zro/pix-payments/application';
import {
  PixDepositFactory,
  PixDevolutionReceivedFactory,
  PixInfractionRefundOperationFactory,
  PixRefundDevolutionFactory,
  PixRefundFactory,
} from '@zro/test/pix-payments/config';

describe('HandleCreatePixRefundDevolutionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventRefundDevolutionEmitter: PixRefundDevolutionEventEmitter =
      createMock<PixRefundDevolutionEventEmitter>();

    const mockPendingRefundDevolution: jest.Mock = On(
      eventRefundDevolutionEmitter,
    ).get(method((mock) => mock.pendingRefundDevolution));

    return {
      eventRefundDevolutionEmitter,
      mockPendingRefundDevolution,
    };
  };

  const mockRepository = () => {
    const refundDevolutionRepository: PixRefundDevolutionRepository =
      createMock<PixRefundDevolutionRepository>();
    const mockGetByIdRefundDevolutionRepository: jest.Mock = On(
      refundDevolutionRepository,
    ).get(method((mock) => mock.getById));
    const mockCountByTransactionRefundDevolutionRepository: jest.Mock = On(
      refundDevolutionRepository,
    ).get(method((mock) => mock.countByTransaction));
    const mockCreateRefundDevolutionRepository: jest.Mock = On(
      refundDevolutionRepository,
    ).get(method((mock) => mock.create));

    const refundRepository: PixRefundRepository =
      createMock<PixRefundRepository>();
    const mockGetByIdRefundRepository: jest.Mock = On(refundRepository).get(
      method((mock) => mock.getById),
    );

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetByIdDepositRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateDepositRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.update),
    );

    const devolutionReceivedRepository: PixDevolutionReceivedRepository =
      createMock<PixDevolutionReceivedRepository>();
    const mockGetByIdDevolutionReceivedRepository: jest.Mock = On(
      devolutionReceivedRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdateDevolutionReceivedRepository: jest.Mock = On(
      devolutionReceivedRepository,
    ).get(method((mock) => mock.update));

    const pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository =
      createMock<PixInfractionRefundOperationRepository>();
    const mockGetAllPixInfractionRefundOperationByFilter: jest.Mock = On(
      pixInfractionRefundOperationRepository,
    ).get(method((mock) => mock.getAllByFilter));

    return {
      refundDevolutionRepository,
      mockGetByIdRefundDevolutionRepository,
      mockCountByTransactionRefundDevolutionRepository,
      mockCreateRefundDevolutionRepository,
      refundRepository,
      mockGetByIdRefundRepository,
      depositRepository,
      mockGetByIdDepositRepository,
      mockUpdateDepositRepository,
      devolutionReceivedRepository,
      mockGetByIdDevolutionReceivedRepository,
      mockUpdateDevolutionReceivedRepository,
      pixInfractionRefundOperationRepository,
      mockGetAllPixInfractionRefundOperationByFilter,
    };
  };

  const makeSut = () => {
    const refundDevolutionMaxNumber = 2;
    const transactionRefundDevolutionIntervalDays = 1;

    const {
      refundDevolutionRepository,
      mockGetByIdRefundDevolutionRepository,
      mockCountByTransactionRefundDevolutionRepository,
      mockCreateRefundDevolutionRepository,
      refundRepository,
      mockGetByIdRefundRepository,
      depositRepository,
      mockGetByIdDepositRepository,
      mockUpdateDepositRepository,
      devolutionReceivedRepository,
      mockGetByIdDevolutionReceivedRepository,
      mockUpdateDevolutionReceivedRepository,
      pixInfractionRefundOperationRepository,
      mockGetAllPixInfractionRefundOperationByFilter,
    } = mockRepository();

    const { eventRefundDevolutionEmitter, mockPendingRefundDevolution } =
      mockEmitter();

    const sut = new UseCase(
      logger,
      refundDevolutionRepository,
      refundRepository,
      eventRefundDevolutionEmitter,
      depositRepository,
      devolutionReceivedRepository,
      pixInfractionRefundOperationRepository,
      refundDevolutionMaxNumber,
      transactionRefundDevolutionIntervalDays,
    );

    return {
      sut,
      mockGetByIdRefundDevolutionRepository,
      mockCountByTransactionRefundDevolutionRepository,
      mockCreateRefundDevolutionRepository,
      mockGetByIdRefundRepository,
      mockGetByIdDepositRepository,
      mockUpdateDepositRepository,
      mockGetByIdDevolutionReceivedRepository,
      mockUpdateDevolutionReceivedRepository,
      mockPendingRefundDevolution,
      mockGetAllPixInfractionRefundOperationByFilter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockCountByTransactionRefundDevolutionRepository,
        mockCreateRefundDevolutionRepository,
        mockGetByIdRefundRepository,
        mockGetByIdDepositRepository,
        mockUpdateDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockUpdateDevolutionReceivedRepository,
        mockPendingRefundDevolution,
        mockGetAllPixInfractionRefundOperationByFilter,
      } = makeSut();

      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(
        mockCountByTransactionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if PixRefund not exists', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockCountByTransactionRefundDevolutionRepository,
        mockCreateRefundDevolutionRepository,
        mockGetByIdRefundRepository,
        mockGetByIdDepositRepository,
        mockUpdateDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockUpdateDevolutionReceivedRepository,
        mockPendingRefundDevolution,
        mockGetAllPixInfractionRefundOperationByFilter,
      } = makeSut();

      const { id } = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
      );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);
      mockGetByIdRefundRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(faker.datatype.uuid(), id);

      await expect(testScript).rejects.toThrow(PixRefundNotFoundException);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(
        mockCountByTransactionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update if Transaction not exists', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockCountByTransactionRefundDevolutionRepository,
        mockCreateRefundDevolutionRepository,
        mockGetByIdRefundRepository,
        mockGetByIdDepositRepository,
        mockUpdateDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockUpdateDevolutionReceivedRepository,
        mockPendingRefundDevolution,
        mockGetAllPixInfractionRefundOperationByFilter,
      } = makeSut();

      const pixRefund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
      );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);
      mockGetByIdRefundRepository.mockResolvedValue(pixRefund);
      mockGetByIdDepositRepository.mockResolvedValue(null);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(faker.datatype.uuid(), pixRefund.id);

      await expect(testScript).rejects.toThrow(PixTransactionNotFoundException);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(
        mockCountByTransactionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not update if created at is before than today added interval days', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockCountByTransactionRefundDevolutionRepository,
        mockCreateRefundDevolutionRepository,
        mockGetByIdRefundRepository,
        mockGetByIdDepositRepository,
        mockUpdateDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockUpdateDevolutionReceivedRepository,
        mockPendingRefundDevolution,
        mockGetAllPixInfractionRefundOperationByFilter,
      } = makeSut();

      const pixRefund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        {
          createdAt: new Date('2022-07-25'),
        },
      );

      const transaction =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);
      mockGetByIdRefundRepository.mockResolvedValue(pixRefund);
      mockGetByIdDepositRepository.mockResolvedValue(null);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(transaction);

      const testScript = () => sut.execute(faker.datatype.uuid(), pixRefund.id);

      await expect(testScript).rejects.toThrow(
        PixRefundTransactionExpiredDevolutionTimeException,
      );
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(
        mockCountByTransactionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not update if amount is greater than deposit amount', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockCountByTransactionRefundDevolutionRepository,
        mockCreateRefundDevolutionRepository,
        mockGetByIdRefundRepository,
        mockGetByIdDepositRepository,
        mockUpdateDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockUpdateDevolutionReceivedRepository,
        mockPendingRefundDevolution,
        mockGetAllPixInfractionRefundOperationByFilter,
      } = makeSut();

      const pixRefund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        {
          createdAt: new Date(),
          amount: 1000,
        },
      );

      const transaction =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          {
            amount: 900,
          },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);
      mockGetByIdRefundRepository.mockResolvedValue(pixRefund);
      mockGetByIdDepositRepository.mockResolvedValue(null);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(transaction);

      const testScript = () => sut.execute(faker.datatype.uuid(), pixRefund.id);

      await expect(testScript).rejects.toThrow(
        PixRefundDevolutionAmountOverflowException,
      );
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(
        mockCountByTransactionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not update if limit of refund is reached', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockCountByTransactionRefundDevolutionRepository,
        mockCreateRefundDevolutionRepository,
        mockGetByIdRefundRepository,
        mockGetByIdDepositRepository,
        mockUpdateDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockUpdateDevolutionReceivedRepository,
        mockPendingRefundDevolution,
        mockGetAllPixInfractionRefundOperationByFilter,
      } = makeSut();

      const pixRefund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        {
          createdAt: new Date(),
          amount: 1000,
        },
      );

      const transaction =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          {
            amount: 1000,
          },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);
      mockGetByIdRefundRepository.mockResolvedValue(pixRefund);
      mockGetByIdDepositRepository.mockResolvedValue(null);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(transaction);
      mockCountByTransactionRefundDevolutionRepository.mockResolvedValue(2);

      const testScript = () => sut.execute(faker.datatype.uuid(), pixRefund.id);

      await expect(testScript).rejects.toThrow(
        PixRefundDevolutionMaxNumberException,
      );
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(
        mockCountByTransactionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not update if amount is greater than available value of transaction', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockCountByTransactionRefundDevolutionRepository,
        mockCreateRefundDevolutionRepository,
        mockGetByIdRefundRepository,
        mockGetByIdDepositRepository,
        mockUpdateDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockUpdateDevolutionReceivedRepository,
        mockPendingRefundDevolution,
        mockGetAllPixInfractionRefundOperationByFilter,
      } = makeSut();

      const pixRefund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        {
          createdAt: new Date(),
          amount: 100,
        },
      );

      const transaction =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          {
            amount: 300,
            returnedAmount: 20,
          },
        );

      const refundOperation = new OperationEntity({
        id: faker.datatype.uuid(),
        value: 500,
      });

      const pixInfractionRefundOperation =
        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
          PixInfractionRefundOperationEntity.name,
          {
            pixRefund,
            originalOperation: transaction.operation,
            refundOperation,
          },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);
      mockGetByIdRefundRepository.mockResolvedValue(pixRefund);
      mockGetByIdDepositRepository.mockResolvedValue(null);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(transaction);
      mockCountByTransactionRefundDevolutionRepository.mockResolvedValue(1);

      mockGetAllPixInfractionRefundOperationByFilter.mockResolvedValue([
        pixInfractionRefundOperation,
      ]);

      const testScript = () => sut.execute(faker.datatype.uuid(), pixRefund.id);

      await expect(testScript).rejects.toThrow(
        PixRefundDevolutionAmountOverflowException,
      );
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(
        mockCountByTransactionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0008 - Should create refund devolution successfully with Pix Devolution Received', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockCountByTransactionRefundDevolutionRepository,
        mockCreateRefundDevolutionRepository,
        mockGetByIdRefundRepository,
        mockGetByIdDepositRepository,
        mockUpdateDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockUpdateDevolutionReceivedRepository,
        mockPendingRefundDevolution,
        mockGetAllPixInfractionRefundOperationByFilter,
      } = makeSut();

      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const operation = new OperationEntity({
        id: faker.datatype.uuid(),
        value: 50,
      });

      const pixRefund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        {
          createdAt: new Date(),
          amount: 100,
          operation,
          transactionType: PixRefundTransactionType.DEVOLUTION_RECEIVED,
        },
      );

      const transaction =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          {
            amount: 100,
            returnedAmount: 0,
            user,
            description: 'test',
          },
        );

      const pixInfractionRefundOperation =
        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
          PixInfractionRefundOperationEntity.name,
          {
            pixRefund,
            originalOperation: transaction.operation,
            refundOperation: pixRefund.operation,
          },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);
      mockGetByIdRefundRepository.mockResolvedValue(pixRefund);
      mockGetByIdDepositRepository.mockResolvedValue(null);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(transaction);
      mockCountByTransactionRefundDevolutionRepository.mockResolvedValue(1);
      mockGetAllPixInfractionRefundOperationByFilter.mockResolvedValue([
        pixInfractionRefundOperation,
      ]);

      const result = await sut.execute(faker.datatype.uuid(), pixRefund.id);

      expect(result).toBeDefined();
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.operation).toBe(operation);
      expect(result.transaction).toBe(transaction);
      expect(result.transactionType).toBe(
        PixRefundDevolutionTransactionType.DEVOLUTION_RECEIVED,
      );
      expect(result.amount).toBe(
        pixInfractionRefundOperation.refundOperation.value,
      );
      expect(result.description).toBe(transaction.description);
      expect(result.devolutionCode).toBe(PixDevolutionCode.FRAUD);
      expect(result.state).toBe(PixRefundDevolutionState.PENDING);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(
        mockCountByTransactionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockPendingRefundDevolution).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should create refund devolution successfully with Deposit', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockCountByTransactionRefundDevolutionRepository,
        mockCreateRefundDevolutionRepository,
        mockGetByIdRefundRepository,
        mockGetByIdDepositRepository,
        mockUpdateDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockUpdateDevolutionReceivedRepository,
        mockPendingRefundDevolution,
        mockGetAllPixInfractionRefundOperationByFilter,
      } = makeSut();

      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const operation = new OperationEntity({
        id: faker.datatype.uuid(),
        value: 50,
      });

      const pixRefund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        {
          createdAt: new Date(),
          amount: 100,
          operation,
          transactionType: PixRefundTransactionType.DEPOSIT,
        },
      );

      const transaction = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          amount: 100,
          returnedAmount: 0,
          user,
          description: 'test',
        },
      );

      const pixInfractionRefundOperation =
        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
          PixInfractionRefundOperationEntity.name,
          {
            pixRefund,
            originalOperation: transaction.operation,
            refundOperation: pixRefund.operation,
          },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);
      mockGetByIdRefundRepository.mockResolvedValue(pixRefund);
      mockGetByIdDepositRepository.mockResolvedValue(transaction);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(null);
      mockCountByTransactionRefundDevolutionRepository.mockResolvedValue(1);
      mockGetAllPixInfractionRefundOperationByFilter.mockResolvedValue([
        pixInfractionRefundOperation,
      ]);

      const result = await sut.execute(faker.datatype.uuid(), pixRefund.id);

      expect(result).toBeDefined();
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.operation).toBe(operation);
      expect(result.transaction).toBe(transaction);
      expect(result.transactionType).toBe(
        PixRefundDevolutionTransactionType.DEPOSIT,
      );
      expect(result.amount).toBe(
        pixInfractionRefundOperation.refundOperation.value,
      );
      expect(result.description).toBe(transaction.description);
      expect(result.devolutionCode).toBe(PixDevolutionCode.FRAUD);
      expect(result.state).toBe(PixRefundDevolutionState.PENDING);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(
        mockCountByTransactionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingRefundDevolution).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0010 - Should return already existing refund devolution', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockCountByTransactionRefundDevolutionRepository,
        mockCreateRefundDevolutionRepository,
        mockGetByIdRefundRepository,
        mockGetByIdDepositRepository,
        mockUpdateDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockUpdateDevolutionReceivedRepository,
        mockPendingRefundDevolution,
        mockGetAllPixInfractionRefundOperationByFilter,
      } = makeSut();

      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            state: PixRefundDevolutionState.PENDING,
          },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(refundDevolution);

      const result = await sut.execute(
        refundDevolution.id,
        faker.datatype.uuid(),
      );

      expect(result).toBeDefined();
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(
        mockCountByTransactionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
    });
  });
});
