import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositEntity,
  PixDepositRepository,
  PixDepositState,
  PixDevolutionEntity,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  HandlePendingFailedPixDevolutionEventUseCase as UseCase,
  PixPaymentGateway,
  PixDevolutionEventEmitter,
  PixDevolutionInvalidStateException,
  PixDevolutionNotFoundException,
  PixDepositNotFoundException,
} from '@zro/pix-payments/application';
import {
  PixDepositFactory,
  PixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('HandlePendingFailedPixDevolutionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      devolutionRepository,
      depositRepository,
      mockUpdateDevolutionRepository,
      mockGetByIdDevolutionRepository,
      mockGetByIdDepositRepository,
    } = mockRepository();

    const { eventEmitter, mockWaitingEventEmitter } = mockEmitter();

    const { pspGateway, mockCreateGateway } = mockGateway();

    const sut = new UseCase(
      logger,
      devolutionRepository,
      depositRepository,
      pspGateway,
      eventEmitter,
    );

    return {
      sut,
      mockUpdateDevolutionRepository,
      mockGetByIdDevolutionRepository,
      mockGetByIdDepositRepository,
      mockWaitingEventEmitter,
      mockCreateGateway,
    };
  };

  const mockRepository = () => {
    const devolutionRepository: PixDevolutionRepository =
      createMock<PixDevolutionRepository>();
    const mockUpdateDevolutionRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.update));
    const mockGetByIdDevolutionRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.getById));

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetByIdDepositRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.getById),
    );

    return {
      devolutionRepository,
      depositRepository,
      mockUpdateDevolutionRepository,
      mockGetByIdDevolutionRepository,
      mockGetByIdDepositRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixDevolutionEventEmitter =
      createMock<PixDevolutionEventEmitter>();
    const mockWaitingEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.waitingDevolution),
    );

    return {
      eventEmitter,
      mockWaitingEventEmitter,
    };
  };

  const mockGateway = () => {
    const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
    const mockCreateGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.createPixDevolution),
    );

    return {
      pspGateway,
      mockCreateGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params', async () => {
      const {
        sut,
        mockUpdateDevolutionRepository,
        mockGetByIdDevolutionRepository,
        mockGetByIdDepositRepository,
        mockWaitingEventEmitter,
        mockCreateGateway,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockWaitingEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw PixDevolutionNotFoundException when devolution is not found', async () => {
      const {
        sut,
        mockUpdateDevolutionRepository,
        mockGetByIdDevolutionRepository,
        mockGetByIdDepositRepository,
        mockWaitingEventEmitter,
        mockCreateGateway,
      } = makeSut();

      mockGetByIdDevolutionRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(faker.datatype.uuid());

      await expect(testScript).rejects.toThrow(PixDevolutionNotFoundException);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockWaitingEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return when devolution state is already waiting or confirmed', async () => {
      const {
        sut,
        mockUpdateDevolutionRepository,
        mockGetByIdDevolutionRepository,
        mockGetByIdDepositRepository,
        mockWaitingEventEmitter,
        mockCreateGateway,
      } = makeSut();

      const pixDevolution =
        await PixDevolutionFactory.create<PixDevolutionEntity>(
          PixDevolutionEntity.name,
          { state: PixDevolutionState.WAITING },
        );

      mockGetByIdDevolutionRepository.mockResolvedValue(pixDevolution);

      const result = await sut.execute(pixDevolution.id);

      expect(result).toMatchObject(pixDevolution);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockWaitingEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw PixDevolutionInvalidStateException when devolution state is invalid', async () => {
      const {
        sut,
        mockUpdateDevolutionRepository,
        mockGetByIdDevolutionRepository,
        mockGetByIdDepositRepository,
        mockWaitingEventEmitter,
        mockCreateGateway,
      } = makeSut();

      const pixDevolution =
        await PixDevolutionFactory.create<PixDevolutionEntity>(
          PixDevolutionEntity.name,
          { state: PixDevolutionState.ERROR },
        );

      mockGetByIdDevolutionRepository.mockResolvedValue(pixDevolution);

      const testScript = () => sut.execute(pixDevolution.id);

      await expect(testScript).rejects.toThrow(
        PixDevolutionInvalidStateException,
      );
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockWaitingEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw PixDepositNotFoundException when deposit is not found', async () => {
      const {
        sut,
        mockUpdateDevolutionRepository,
        mockGetByIdDevolutionRepository,
        mockGetByIdDepositRepository,
        mockWaitingEventEmitter,
        mockCreateGateway,
      } = makeSut();

      const pixDevolution =
        await PixDevolutionFactory.create<PixDevolutionEntity>(
          PixDevolutionEntity.name,
          { state: PixDevolutionState.PENDING },
        );

      mockGetByIdDevolutionRepository.mockResolvedValue(pixDevolution);
      mockGetByIdDepositRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(pixDevolution.id);

      await expect(testScript).rejects.toThrow(PixDepositNotFoundException);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should update pix devolution successfully', async () => {
      const {
        sut,
        mockUpdateDevolutionRepository,
        mockGetByIdDevolutionRepository,
        mockGetByIdDepositRepository,
        mockWaitingEventEmitter,
        mockCreateGateway,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { state: PixDepositState.BLOCKED },
      );

      const pixDevolution =
        await PixDevolutionFactory.create<PixDevolutionEntity>(
          PixDevolutionEntity.name,
          { state: PixDevolutionState.PENDING, deposit: pixDeposit },
        );

      mockGetByIdDevolutionRepository.mockResolvedValue(pixDevolution);
      mockGetByIdDepositRepository.mockResolvedValue(pixDeposit);

      const result = await sut.execute(pixDevolution.id);

      expect(result.state).toBe(PixDevolutionState.WAITING);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockCreateGateway).toHaveBeenCalledTimes(1);
    });
  });
});
