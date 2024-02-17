import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  PixKeyClaimRepository,
  PixKeyClaimEntity,
  ClaimStatusType,
} from '@zro/pix-keys/domain';
import {
  SyncGetAllPixKeyClaimPixKeyUseCase as UseCase,
  PixKeyGateway,
  PixKeyClaimEventEmitter,
} from '@zro/pix-keys/application';
import { PixKeyClaimFactory } from '@zro/test/pix-keys/config';

describe('SyncGetAllPixKeyClaimPixKeyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const { eventEmitter, mockReadyPixKeyClaimEvent } = mockEmitter();
    const {
      pixKeyClaimRepository,
      mockGetRepository,
      mockCreateRepository,
      mockUpdateRepository,
    } = mockRepository();
    const { pspGateway, mockGetClaimPixKeyGateway } = mockGateway();
    const zroIspb = '26264220';
    const pageSize = 100;
    const limitDay = 10;

    const sut = new UseCase(
      logger,
      pixKeyClaimRepository,
      eventEmitter,
      pspGateway,
      zroIspb,
      pageSize,
      limitDay,
    );

    return {
      sut,
      mockReadyPixKeyClaimEvent,
      mockGetRepository,
      mockCreateRepository,
      mockUpdateRepository,
      mockGetClaimPixKeyGateway,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixKeyClaimEventEmitter =
      createMock<PixKeyClaimEventEmitter>();
    const mockReadyPixKeyClaimEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.readyPixKeyClaim),
    );

    return { eventEmitter, mockReadyPixKeyClaimEvent };
  };

  const mockRepository = () => {
    const pixKeyClaimRepository: PixKeyClaimRepository =
      createMock<PixKeyClaimRepository>();
    const mockGetRepository: jest.Mock = On(pixKeyClaimRepository).get(
      method((mock) => mock.getById),
    );
    const mockCreateRepository: jest.Mock = On(pixKeyClaimRepository).get(
      method((mock) => mock.create),
    );
    const mockUpdateRepository: jest.Mock = On(pixKeyClaimRepository).get(
      method((mock) => mock.update),
    );

    return {
      pixKeyClaimRepository,
      mockGetRepository,
      mockCreateRepository,
      mockUpdateRepository,
    };
  };

  const mockGateway = () => {
    const pspGateway: PixKeyGateway = createMock<PixKeyGateway>();
    const mockGetClaimPixKeyGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.getClaimPixKey),
    );

    return { pspGateway, mockGetClaimPixKeyGateway };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle claim successfully when it is new', async () => {
      const {
        sut,
        mockReadyPixKeyClaimEvent,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockGetClaimPixKeyGateway,
      } = makeSut();

      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );
      mockGetClaimPixKeyGateway.mockResolvedValue({ claims: [pixKeyClaim] });
      mockGetRepository.mockResolvedValue(null);

      await sut.execute();

      expect(mockGetClaimPixKeyGateway).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyPixKeyClaimEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should handle claim successfully when status is updated', async () => {
      const {
        sut,
        mockReadyPixKeyClaimEvent,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockGetClaimPixKeyGateway,
      } = makeSut();

      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
        { status: ClaimStatusType.CONFIRMED },
      );
      mockGetClaimPixKeyGateway.mockResolvedValue({ claims: [pixKeyClaim] });
      mockGetRepository.mockResolvedValue({
        ...pixKeyClaim,
        status: ClaimStatusType.CANCELLED,
      });

      await sut.execute();

      expect(mockGetClaimPixKeyGateway).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockReadyPixKeyClaimEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not handle claim when it already exists', async () => {
      const {
        sut,
        mockReadyPixKeyClaimEvent,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockGetClaimPixKeyGateway,
      } = makeSut();

      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );
      mockGetClaimPixKeyGateway.mockResolvedValue({ claims: [pixKeyClaim] });
      mockGetRepository.mockResolvedValue(pixKeyClaim);

      await sut.execute();

      expect(mockGetClaimPixKeyGateway).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyPixKeyClaimEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not handle claim when there is none', async () => {
      const {
        sut,
        mockReadyPixKeyClaimEvent,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockGetClaimPixKeyGateway,
      } = makeSut();

      mockGetClaimPixKeyGateway.mockResolvedValue({ claims: [] });

      await sut.execute();

      expect(mockGetClaimPixKeyGateway).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyPixKeyClaimEvent).toHaveBeenCalledTimes(0);
    });
  });
});
