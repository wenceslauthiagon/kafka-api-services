import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixInfractionEntity,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
} from '@zro/pix-payments/domain';
import {
  HandleClosePendingPixInfractionEventUseCase as UseCase,
  PixInfractionEventEmitter,
  PixInfractionGateway,
  PixInfractionInvalidStateException,
  PixInfractionNotFoundException,
} from '@zro/pix-payments/application';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('HandleClosePendingInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockCloseConfirmedInfractionEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.closedConfirmedInfraction),
    );

    return {
      eventEmitter,
      mockCloseConfirmedInfractionEvent,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockUpdateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.update));
    const mockGetByIdInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.getById));

    return {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetByIdInfractionRepository,
    };
  };

  const mockGateway = () => {
    const infractionGateway: PixInfractionGateway =
      createMock<PixInfractionGateway>();
    const mockCloseInfractionPixInfractionGateway: jest.Mock = On(
      infractionGateway,
    ).get(method((mock) => mock.closeInfraction));

    return {
      infractionGateway,
      mockCloseInfractionPixInfractionGateway,
    };
  };

  const makeSut = () => {
    const {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetByIdInfractionRepository,
    } = mockRepository();

    const { infractionGateway, mockCloseInfractionPixInfractionGateway } =
      mockGateway();

    const { eventEmitter, mockCloseConfirmedInfractionEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      infractionRepository,
      infractionGateway,
      eventEmitter,
    );
    return {
      sut,
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetByIdInfractionRepository,
      mockCloseConfirmedInfractionEvent,
      mockCloseInfractionPixInfractionGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetByIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockCloseConfirmedInfractionEvent,
        mockCloseInfractionPixInfractionGateway,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockCloseConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockCloseInfractionPixInfractionGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if infraction not exists', async () => {
      const {
        sut,
        mockGetByIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockCloseConfirmedInfractionEvent,
        mockCloseInfractionPixInfractionGateway,
      } = makeSut();
      const { id } = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );
      mockGetByIdInfractionRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);
      expect(mockGetByIdInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockCloseConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockCloseInfractionPixInfractionGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update if state is invalid', async () => {
      const {
        sut,
        mockGetByIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockCloseConfirmedInfractionEvent,
        mockCloseInfractionPixInfractionGateway,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        { state: PixInfractionState.CANCEL_PENDING },
      );
      mockGetByIdInfractionRepository.mockResolvedValue(infraction);

      const testScript = () => sut.execute(infraction.id);

      await expect(testScript).rejects.toThrow(
        PixInfractionInvalidStateException,
      );
      expect(mockGetByIdInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockCloseConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockCloseInfractionPixInfractionGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - should create infraction successfully', async () => {
      const {
        sut,
        mockGetByIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockCloseConfirmedInfractionEvent,
        mockCloseInfractionPixInfractionGateway,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        { state: PixInfractionState.CLOSED_PENDING },
      );

      mockGetByIdInfractionRepository.mockResolvedValue(infraction);

      const result = await sut.execute(infraction.id);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.CLOSED);
      expect(result.state).toEqual(PixInfractionState.CLOSED_CONFIRMED);
      expect(mockGetByIdInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockCloseConfirmedInfractionEvent).toHaveBeenCalledTimes(1);
      expect(mockCloseInfractionPixInfractionGateway).toHaveBeenCalledTimes(1);
    });
  });
});
