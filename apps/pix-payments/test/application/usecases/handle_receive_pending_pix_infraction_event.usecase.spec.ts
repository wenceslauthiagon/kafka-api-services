import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixInfractionEntity,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionType,
} from '@zro/pix-payments/domain';
import {
  HandleReceivePendingPixInfractionEventUseCase as UseCase,
  PixInfractionEventEmitter,
  IssueInfractionGateway,
  PixInfractionNotFoundException,
} from '@zro/pix-payments/application';
import { InfractionFactory } from '@zro/test/pix-payments/config';
import * as createInfractionGatewayMock from '@zro/test/pix-payments/config/mocks/create_infraction_gateway.mock';

describe('ReceiveInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockReceiveConfirmedInfractionReceivedEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.receiveConfirmedInfraction));

    return {
      eventEmitter,
      mockReceiveConfirmedInfractionReceivedEvent,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockUpdateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.update));
    const mockGetInfractionByIdRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.getById));

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetDepositByIdRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.getById),
    );

    const devolutionReceivedRepository: PixDevolutionReceivedRepository =
      createMock<PixDevolutionReceivedRepository>();

    return {
      infractionRepository,
      depositRepository,
      devolutionReceivedRepository,
      mockUpdateInfractionRepository,
      mockGetInfractionByIdRepository,
      mockGetDepositByIdRepository,
    };
  };

  const mockGateway = () => {
    const infractionGateway: IssueInfractionGateway =
      createMock<IssueInfractionGateway>();
    const mockCreateInfractionGateway: jest.Mock = On(infractionGateway).get(
      method((mock) => mock.createInfraction),
    );
    const mockUpdateInfractionGateway: jest.Mock = On(infractionGateway).get(
      method((mock) => mock.updateInfraction),
    );
    const mockUpdateInfractionStatusGateway: jest.Mock = On(
      infractionGateway,
    ).get(method((mock) => mock.updateInfractionStatus));

    return {
      infractionGateway,
      mockCreateInfractionGateway,
      mockUpdateInfractionGateway,
      mockUpdateInfractionStatusGateway,
    };
  };

  const makeSut = () => {
    const infractionDueDate = '7';
    const {
      infractionRepository,
      depositRepository,
      devolutionReceivedRepository,
      mockGetInfractionByIdRepository,
      mockGetDepositByIdRepository,
      mockUpdateInfractionRepository,
    } = mockRepository();

    const { eventEmitter, mockReceiveConfirmedInfractionReceivedEvent } =
      mockEmitter();

    const {
      infractionGateway,
      mockCreateInfractionGateway,
      mockUpdateInfractionGateway,
      mockUpdateInfractionStatusGateway,
    } = mockGateway();

    const sut = new UseCase(
      logger,
      infractionRepository,
      depositRepository,
      devolutionReceivedRepository,
      infractionGateway,
      eventEmitter,
      infractionDueDate,
    );

    return {
      sut,
      mockGetInfractionByIdRepository,
      mockGetDepositByIdRepository,
      mockUpdateInfractionRepository,
      mockReceiveConfirmedInfractionReceivedEvent,
      mockCreateInfractionGateway,
      mockUpdateInfractionGateway,
      mockUpdateInfractionStatusGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - should update infraction successfully after gateway', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockCreateInfractionGateway,
        mockUpdateInfractionGateway,
        mockUpdateInfractionStatusGateway,
        mockReceiveConfirmedInfractionReceivedEvent,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          infractionType: PixInfractionType.FRAUD,
          state: PixInfractionState.RECEIVE_PENDING,
        },
      );

      mockGetInfractionByIdRepository.mockResolvedValue(infraction);
      mockUpdateInfractionRepository.mockImplementation((body) => body);

      mockCreateInfractionGateway.mockImplementationOnce(
        createInfractionGatewayMock.success,
      );

      const result = await sut.execute(infraction.id);

      expect(result).toBeDefined();
      expect(result.issueId).toBeDefined();
      expect(result.state).toBe(PixInfractionState.RECEIVE_CONFIRMED);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionGateway).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionStatusGateway).toHaveBeenCalledTimes(1);
      expect(mockReceiveConfirmedInfractionReceivedEvent).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw MissingDataException if there are missing data', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockCreateInfractionGateway,
        mockUpdateInfractionGateway,
        mockUpdateInfractionStatusGateway,
        mockReceiveConfirmedInfractionReceivedEvent,
      } = makeSut();

      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateInfractionGateway).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionStatusGateway).toHaveBeenCalledTimes(0);
      expect(mockReceiveConfirmedInfractionReceivedEvent).toHaveBeenCalledTimes(
        0,
      );
    });

    it('TC0003 - Should throw InfractionNotFoundException if infraction is not found', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockCreateInfractionGateway,
        mockUpdateInfractionGateway,
        mockUpdateInfractionStatusGateway,
        mockReceiveConfirmedInfractionReceivedEvent,
      } = makeSut();

      mockGetInfractionByIdRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(uuidV4());

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);

      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateInfractionGateway).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionStatusGateway).toHaveBeenCalledTimes(0);
      expect(mockReceiveConfirmedInfractionReceivedEvent).toHaveBeenCalledTimes(
        0,
      );
    });
  });
});
