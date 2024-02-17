import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  PixInfractionRepository,
  PixInfractionStatus,
} from '@zro/pix-payments/domain';
import {
  PixInfractionEventEmitter,
  PixInfractionGateway,
  SyncPixInfractionUseCase as UseCase,
} from '@zro/pix-payments/application';
import * as MockTestGetInfraction from '@zro/test/pix-payments/config/mocks/get_infractions.mock';

describe('SyncPixInfractionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { pixInfractionRepository, mockGetByIdRepository } = mockRepository();

    const {
      eventEmitter,
      mockAcknowledgeEvent,
      mockReceiveEvent,
      mockCancelEvent,
      mockCloseEvent,
    } = mockEmitter();

    const { pspGateway, mockGetGateway } = mockGateway();

    const sut = new UseCase(
      logger,
      pixInfractionRepository,
      pspGateway,
      eventEmitter,
    );

    return {
      sut,
      mockAcknowledgeEvent,
      mockReceiveEvent,
      mockCancelEvent,
      mockCloseEvent,
      mockGetGateway,
      mockGetByIdRepository,
    };
  };

  const mockRepository = () => {
    const pixInfractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockGetByIdRepository: jest.Mock = On(pixInfractionRepository).get(
      method((mock) => mock.getById),
    );

    return {
      pixInfractionRepository,
      mockGetByIdRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();
    const mockAcknowledgeEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.acknowledgePixInfraction),
    );
    const mockReceiveEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.receivePixInfraction),
    );
    const mockCancelEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.cancelPixInfractionReceived),
    );
    const mockCloseEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.closePixInfractionReceived),
    );

    return {
      eventEmitter,
      mockAcknowledgeEvent,
      mockReceiveEvent,
      mockCancelEvent,
      mockCloseEvent,
    };
  };

  const mockGateway = () => {
    const pspGateway: PixInfractionGateway = createMock<PixInfractionGateway>();
    const mockGetGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.getInfractions),
    );

    return {
      pspGateway,
      mockGetGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle notify infraction when acknowledged', async () => {
      const {
        sut,
        mockAcknowledgeEvent,
        mockReceiveEvent,
        mockCancelEvent,
        mockCloseEvent,
        mockGetByIdRepository,
        mockGetGateway,
      } = makeSut();

      mockGetGateway.mockImplementation(() =>
        MockTestGetInfraction.success(PixInfractionStatus.ACKNOWLEDGED),
      );

      const pixInfractionId = uuidV4();

      mockGetByIdRepository.mockResolvedValue({ id: pixInfractionId });

      await sut.execute();

      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockAcknowledgeEvent).toHaveBeenCalledTimes(1);
      expect(mockReceiveEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelEvent).toHaveBeenCalledTimes(0);
      expect(mockCloseEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should handle notify infraction when acknowledged but is a infraction received', async () => {
      const {
        sut,
        mockAcknowledgeEvent,
        mockReceiveEvent,
        mockCancelEvent,
        mockCloseEvent,
        mockGetByIdRepository,
        mockGetGateway,
      } = makeSut();

      mockGetGateway.mockImplementation(() =>
        MockTestGetInfraction.success(PixInfractionStatus.ACKNOWLEDGED),
      );

      mockGetByIdRepository.mockResolvedValue(null);

      await sut.execute();

      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockAcknowledgeEvent).toHaveBeenCalledTimes(0);
      expect(mockReceiveEvent).toHaveBeenCalledTimes(1);
      expect(mockCancelEvent).toHaveBeenCalledTimes(0);
      expect(mockCloseEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should handle notify infraction when canceled infraction', async () => {
      const {
        sut,
        mockAcknowledgeEvent,
        mockReceiveEvent,
        mockCancelEvent,
        mockCloseEvent,
        mockGetByIdRepository,
        mockGetGateway,
      } = makeSut();

      mockGetGateway.mockImplementation(() =>
        MockTestGetInfraction.success(PixInfractionStatus.CANCELLED),
      );

      await sut.execute();

      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockAcknowledgeEvent).toHaveBeenCalledTimes(0);
      expect(mockReceiveEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelEvent).toHaveBeenCalledTimes(1);
      expect(mockCloseEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should handle notify infraction when close infraction', async () => {
      const {
        sut,
        mockAcknowledgeEvent,
        mockReceiveEvent,
        mockCancelEvent,
        mockCloseEvent,
        mockGetByIdRepository,
        mockGetGateway,
      } = makeSut();

      mockGetGateway.mockImplementation(() =>
        MockTestGetInfraction.success(PixInfractionStatus.CLOSED),
      );

      await sut.execute();

      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockAcknowledgeEvent).toHaveBeenCalledTimes(0);
      expect(mockReceiveEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelEvent).toHaveBeenCalledTimes(0);
      expect(mockCloseEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should not found infractions.', async () => {
      const {
        sut,
        mockAcknowledgeEvent,
        mockReceiveEvent,
        mockCancelEvent,
        mockCloseEvent,
        mockGetByIdRepository,
        mockGetGateway,
      } = makeSut();

      mockGetGateway.mockImplementation(() =>
        MockTestGetInfraction.success(PixInfractionStatus.RECEIVED),
      );

      await sut.execute();

      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockAcknowledgeEvent).toHaveBeenCalledTimes(0);
      expect(mockReceiveEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelEvent).toHaveBeenCalledTimes(0);
      expect(mockCloseEvent).toHaveBeenCalledTimes(0);
    });
  });
});
