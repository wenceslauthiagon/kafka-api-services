import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositEntity,
  PixDepositRepository,
  PixDepositState,
  PixDevolutionCode,
  PixDevolutionEntity,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  HandleCreateFailedPixDevolutionEventUseCase as UseCase,
  PixDepositInvalidStateException,
  PixDepositNotFoundException,
  PixDevolutionEventEmitter,
} from '@zro/pix-payments/application';
import {
  PixDevolutionFactory,
  PixDepositFactory,
} from '@zro/test/pix-payments/config';

describe('HandleCreateFailedPixDevolutionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      devolutionRepository,
      mockCreatePixDevolutionRepository,
      mockGetByIdPixDevolutionRepository,
      depositRepository,
      mockUpdatePixDepositRepository,
      mockGetByIdPixDepositRepository,
    } = mockRepository();

    const { eventEmitter, mockPendingFailedEventEmitter } = mockEmitter();

    const sut = new UseCase(
      logger,
      devolutionRepository,
      depositRepository,
      eventEmitter,
    );

    return {
      sut,
      mockCreatePixDevolutionRepository,
      mockGetByIdPixDevolutionRepository,
      mockUpdatePixDepositRepository,
      mockGetByIdPixDepositRepository,
      mockPendingFailedEventEmitter,
    };
  };

  const mockRepository = () => {
    const devolutionRepository: PixDevolutionRepository =
      createMock<PixDevolutionRepository>();
    const mockCreatePixDevolutionRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.create));
    const mockGetByIdPixDevolutionRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.getById));

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockUpdatePixDepositRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.update),
    );
    const mockGetByIdPixDepositRepository: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.getById));

    return {
      devolutionRepository,
      mockCreatePixDevolutionRepository,
      mockGetByIdPixDevolutionRepository,
      depositRepository,
      mockUpdatePixDepositRepository,
      mockGetByIdPixDepositRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixDevolutionEventEmitter =
      createMock<PixDevolutionEventEmitter>();
    const mockPendingFailedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.pendingFailedPixDevolution),
    );

    return {
      eventEmitter,
      mockPendingFailedEventEmitter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params', async () => {
      const {
        sut,
        mockCreatePixDevolutionRepository,
        mockGetByIdPixDevolutionRepository,
        mockUpdatePixDepositRepository,
        mockGetByIdPixDepositRepository,
        mockPendingFailedEventEmitter,
      } = makeSut();

      const testScripts = [
        () => sut.execute(null, null),
        () => sut.execute(faker.datatype.uuid(), null),
        () => sut.execute(null, faker.datatype.uuid()),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
      }
      expect(mockCreatePixDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingFailedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should return if pix devolution is already created', async () => {
      const {
        sut,
        mockCreatePixDevolutionRepository,
        mockGetByIdPixDevolutionRepository,
        mockUpdatePixDepositRepository,
        mockGetByIdPixDepositRepository,
        mockPendingFailedEventEmitter,
      } = makeSut();

      const pixDevolution =
        await PixDevolutionFactory.create<PixDevolutionEntity>(
          PixDevolutionEntity.name,
          { state: PixDevolutionState.WAITING },
        );

      mockGetByIdPixDevolutionRepository.mockResolvedValue(pixDevolution);

      const result = await sut.execute(
        pixDevolution.id,
        pixDevolution.deposit.id,
      );

      expect(result).toMatchObject(pixDevolution);
      expect(mockCreatePixDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingFailedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixDepositNotFoundException if deposit is not found', async () => {
      const {
        sut,
        mockCreatePixDevolutionRepository,
        mockGetByIdPixDevolutionRepository,
        mockUpdatePixDepositRepository,
        mockGetByIdPixDepositRepository,
        mockPendingFailedEventEmitter,
      } = makeSut();

      mockGetByIdPixDevolutionRepository.mockResolvedValue(null);
      mockGetByIdPixDepositRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(faker.datatype.uuid(), faker.datatype.uuid());

      await expect(testScript).rejects.toThrow(PixDepositNotFoundException);
      expect(mockCreatePixDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockPendingFailedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw PixDepositInvalidStateException if deposit state is invalid', async () => {
      const {
        sut,
        mockCreatePixDevolutionRepository,
        mockGetByIdPixDevolutionRepository,
        mockUpdatePixDepositRepository,
        mockGetByIdPixDepositRepository,
        mockPendingFailedEventEmitter,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.NEW,
        },
      );

      mockGetByIdPixDevolutionRepository.mockResolvedValue(null);
      mockGetByIdPixDepositRepository.mockResolvedValue(pixDeposit);

      const testScript = () =>
        sut.execute(faker.datatype.uuid(), pixDeposit.id);

      await expect(testScript).rejects.toThrow(PixDepositInvalidStateException);
      expect(mockCreatePixDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockPendingFailedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should create pix devolution successfully', async () => {
      const {
        sut,
        mockCreatePixDevolutionRepository,
        mockGetByIdPixDevolutionRepository,
        mockUpdatePixDepositRepository,
        mockGetByIdPixDepositRepository,
        mockPendingFailedEventEmitter,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.ERROR,
          description: 'test',
        },
      );

      mockGetByIdPixDevolutionRepository.mockResolvedValue(null);
      mockGetByIdPixDepositRepository.mockResolvedValue(pixDeposit);

      const result = await sut.execute(faker.datatype.uuid(), pixDeposit.id);

      expect(pixDeposit.returnedAmount).toBe(pixDeposit.amount);
      expect(result.deposit).toMatchObject(pixDeposit);
      expect(result.endToEndId).toBe(pixDeposit.endToEndId);
      expect(result.amount).toBe(pixDeposit.amount);
      expect(result.devolutionCode).toBe(PixDevolutionCode.PSP_ERROR);
      expect(result.description).toBe(pixDeposit.description);
      expect(result.state).toBe(PixDevolutionState.PENDING);
      expect(mockCreatePixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockPendingFailedEventEmitter).toHaveBeenCalledTimes(1);
    });
  });
});
