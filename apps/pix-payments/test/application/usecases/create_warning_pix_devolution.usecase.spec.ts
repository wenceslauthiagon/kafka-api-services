import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
} from '@zro/common';
import {
  PixDepositState,
  PixDepositEntity,
  WarningPixDepositEntity,
  PixDepositRepository,
  WarningPixDepositRepository,
  WarningPixDevolutionRepository,
  WarningPixDepositState,
  WarningPixDevolutionState,
  WarningPixDevolutionEntity,
} from '@zro/pix-payments/domain';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity } from '@zro/operations/domain';
import {
  CreateWarningPixDevolutionUseCase as UseCase,
  PixDepositEventEmitter,
  WarningPixDevolutionEventEmitter,
  PixDepositNotFoundException,
  PixDepositInvalidStateException,
  WarningPixDepositInvalidStateException,
  WarningPixDepositNotFoundException,
  WarningPixDevolutionAlreadyExistsException,
} from '@zro/pix-payments/application';
import { UserFactory } from '@zro/test/users/config';
import { OperationFactory } from '@zro/test/operations/config';
import {
  PixDepositFactory,
  WarningPixDepositFactory,
  WarningPixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('CreateWarningPixDevolutionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const warningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitter =
      createMock<WarningPixDevolutionEventEmitter>();
    const mockCreateWarningPixDevolutionEvent: jest.Mock = On(
      warningPixDevolutionEventEmitter,
    ).get(method((mock) => mock.createWarningPixDevolution));

    const pixDepositEventEmitter: PixDepositEventEmitter =
      createMock<PixDepositEventEmitter>();
    const mockBlockedPixDepositEvent: jest.Mock = On(
      pixDepositEventEmitter,
    ).get(method((mock) => mock.blockedDeposit));

    return {
      warningPixDevolutionEventEmitter,
      mockCreateWarningPixDevolutionEvent,
      pixDepositEventEmitter,
      mockBlockedPixDepositEvent,
    };
  };

  const mockRepository = () => {
    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetDepositByOperationRepository: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.getByOperation));
    const mockUpdateWarningPixDeposit: jest.Mock = On(depositRepository).get(
      method((mock) => mock.update),
    );

    const warningPixDepositRepository: WarningPixDepositRepository =
      createMock<WarningPixDepositRepository>();
    const mockGetWarningPixDepositByOperation: jest.Mock = On(
      warningPixDepositRepository,
    ).get(method((mock) => mock.getByOperation));

    const warningPixDevolutionRepository: WarningPixDevolutionRepository =
      createMock<WarningPixDevolutionRepository>();
    const mockGetWarningPixDevolutionByOperation: jest.Mock = On(
      warningPixDevolutionRepository,
    ).get(method((mock) => mock.getByOperation));

    return {
      depositRepository,
      mockGetDepositByOperationRepository,
      warningPixDepositRepository,
      mockGetWarningPixDepositByOperation,
      mockUpdateWarningPixDeposit,
      warningPixDevolutionRepository,
      mockGetWarningPixDevolutionByOperation,
    };
  };

  const makeSut = () => {
    const {
      depositRepository,
      mockGetDepositByOperationRepository,
      warningPixDepositRepository,
      mockGetWarningPixDepositByOperation,
      mockUpdateWarningPixDeposit,
      warningPixDevolutionRepository,
      mockGetWarningPixDevolutionByOperation,
    } = mockRepository();

    const {
      warningPixDevolutionEventEmitter,
      mockCreateWarningPixDevolutionEvent,
      pixDepositEventEmitter,
      mockBlockedPixDepositEvent,
    } = mockEmitter();

    const sut = new UseCase(
      logger,
      depositRepository,
      warningPixDepositRepository,
      warningPixDevolutionRepository,
      pixDepositEventEmitter,
      warningPixDevolutionEventEmitter,
    );

    return {
      sut,
      mockGetDepositByOperationRepository,
      mockGetWarningPixDepositByOperation,
      mockUpdateWarningPixDeposit,
      mockCreateWarningPixDevolutionEvent,
      mockBlockedPixDepositEvent,
      mockGetWarningPixDevolutionByOperation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw if missing params', async () => {
      const {
        sut,
        mockGetDepositByOperationRepository,
        mockGetWarningPixDepositByOperation,
        mockGetWarningPixDevolutionByOperation,
        mockCreateWarningPixDevolutionEvent,
        mockUpdateWarningPixDeposit,
        mockBlockedPixDepositEvent,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      const tests = [
        sut.execute(null, null),
        sut.execute(new UserEntity({}), null),
        sut.execute(null, new OperationEntity({})),
        sut.execute(user, null),
        sut.execute(null, operation),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrowError(MissingDataException);
      }

      expect(mockGetDepositByOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockBlockedPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw if pix deposit not found', async () => {
      const {
        sut,
        mockGetDepositByOperationRepository,
        mockGetWarningPixDepositByOperation,
        mockGetWarningPixDevolutionByOperation,
        mockCreateWarningPixDevolutionEvent,
        mockUpdateWarningPixDeposit,
        mockBlockedPixDepositEvent,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      mockGetDepositByOperationRepository.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(user, operation);

      await expect(testScript).rejects.toThrowError(
        PixDepositNotFoundException,
      );

      expect(mockGetDepositByOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockBlockedPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw if user is not pix deposit user', async () => {
      const {
        sut,
        mockGetDepositByOperationRepository,
        mockGetWarningPixDepositByOperation,
        mockGetWarningPixDevolutionByOperation,
        mockCreateWarningPixDevolutionEvent,
        mockUpdateWarningPixDeposit,
        mockBlockedPixDepositEvent,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetDepositByOperationRepository.mockResolvedValueOnce(deposit);

      const testScript = () => sut.execute(user, operation);

      await expect(testScript).rejects.toThrowError(ForbiddenException);

      expect(mockGetDepositByOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockBlockedPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw if pix deposit has invalid state', async () => {
      const {
        sut,
        mockGetDepositByOperationRepository,
        mockGetWarningPixDepositByOperation,
        mockGetWarningPixDevolutionByOperation,
        mockCreateWarningPixDevolutionEvent,
        mockUpdateWarningPixDeposit,
        mockBlockedPixDepositEvent,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          user,
          operation,
          state: PixDepositState.RECEIVED,
        },
      );

      mockGetDepositByOperationRepository.mockResolvedValueOnce(deposit);

      const testScript = () => sut.execute(user, operation);

      await expect(testScript).rejects.toThrowError(
        PixDepositInvalidStateException,
      );

      expect(mockGetDepositByOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockBlockedPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw if warning pix deposit not found', async () => {
      const {
        sut,
        mockGetDepositByOperationRepository,
        mockGetWarningPixDepositByOperation,
        mockGetWarningPixDevolutionByOperation,
        mockCreateWarningPixDevolutionEvent,
        mockUpdateWarningPixDeposit,
        mockBlockedPixDepositEvent,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          user,
          operation,
          state: PixDepositState.NEW,
        },
      );

      mockGetDepositByOperationRepository.mockResolvedValueOnce(deposit);
      mockGetWarningPixDepositByOperation.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(user, operation);

      await expect(testScript).rejects.toThrowError(
        WarningPixDepositNotFoundException,
      );

      expect(mockGetDepositByOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockBlockedPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should throw if warning pix deposit has invalid state', async () => {
      const {
        sut,
        mockGetDepositByOperationRepository,
        mockGetWarningPixDepositByOperation,
        mockGetWarningPixDevolutionByOperation,
        mockCreateWarningPixDevolutionEvent,
        mockUpdateWarningPixDeposit,
        mockBlockedPixDepositEvent,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          user,
          operation,
          state: PixDepositState.NEW,
        },
      );
      const warningPixDeposit =
        await WarningPixDepositFactory.create<WarningPixDepositEntity>(
          WarningPixDepositEntity.name,
          {
            state: WarningPixDepositState.APPROVED,
          },
        );

      mockGetDepositByOperationRepository.mockResolvedValueOnce(deposit);
      mockGetWarningPixDepositByOperation.mockResolvedValueOnce(
        warningPixDeposit,
      );

      const testScript = () => sut.execute(user, operation);

      await expect(testScript).rejects.toThrowError(
        WarningPixDepositInvalidStateException,
      );

      expect(mockGetDepositByOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockBlockedPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should throw if warning pix devolution found', async () => {
      const {
        sut,
        mockGetDepositByOperationRepository,
        mockGetWarningPixDepositByOperation,
        mockGetWarningPixDevolutionByOperation,
        mockCreateWarningPixDevolutionEvent,
        mockUpdateWarningPixDeposit,
        mockBlockedPixDepositEvent,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          user,
          operation,
          state: PixDepositState.NEW,
        },
      );
      const warningPixDeposit =
        await WarningPixDepositFactory.create<WarningPixDepositEntity>(
          WarningPixDepositEntity.name,
          {
            state: WarningPixDepositState.CREATED,
          },
        );
      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            user,
            operation,
            state: WarningPixDevolutionState.PENDING,
          },
        );

      mockGetDepositByOperationRepository.mockResolvedValueOnce(deposit);
      mockGetWarningPixDepositByOperation.mockResolvedValueOnce(
        warningPixDeposit,
      );
      mockGetWarningPixDevolutionByOperation.mockResolvedValueOnce(
        warningPixDevolution,
      );

      const testScript = () => sut.execute(user, operation);

      await expect(testScript).rejects.toThrowError(
        WarningPixDevolutionAlreadyExistsException,
      );

      expect(mockGetDepositByOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(1);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockBlockedPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0008 - Should create successfully', async () => {
      const {
        sut,
        mockGetDepositByOperationRepository,
        mockGetWarningPixDepositByOperation,
        mockGetWarningPixDevolutionByOperation,
        mockCreateWarningPixDevolutionEvent,
        mockUpdateWarningPixDeposit,
        mockBlockedPixDepositEvent,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          user,
          operation,
          state: PixDepositState.NEW,
        },
      );
      const warningPixDeposit =
        await WarningPixDepositFactory.create<WarningPixDepositEntity>(
          WarningPixDepositEntity.name,
          {
            state: WarningPixDepositState.CREATED,
          },
        );

      mockGetDepositByOperationRepository.mockResolvedValueOnce(deposit);
      mockGetWarningPixDepositByOperation.mockResolvedValueOnce(
        warningPixDeposit,
      );
      mockGetWarningPixDevolutionByOperation.mockResolvedValueOnce(null);

      const result = await sut.execute(user, operation);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.state).toBe(WarningPixDevolutionState.PENDING);
      expect(mockGetDepositByOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(1);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(1);
      expect(mockBlockedPixDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningPixDevolutionEvent).toHaveBeenCalledTimes(1);
    });
  });
});
