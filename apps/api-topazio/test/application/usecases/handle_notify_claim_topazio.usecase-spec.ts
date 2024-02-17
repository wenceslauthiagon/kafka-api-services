import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  ClaimStatusType,
  ClaimType,
  KeyState,
  PixKeyEntity,
} from '@zro/pix-keys/domain';
import {
  NotifyClaimEntity,
  NotifyClaimRepository,
} from '@zro/api-topazio/domain';
import { PixKeyNotFoundException } from '@zro/pix-keys/application';
import {
  HandleNotifyClaimTopazioEventUseCase,
  NotifyClaimInvalidFlowException,
} from '@zro/api-topazio/application';
import { PixKeyServiceKafka } from '@zro/api-topazio/infrastructure';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('HandleNotifyClaimTopazioEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const { notifyClaimRepository, mockCreateRepository } = mockRepository();
    const {
      pixKeyService,
      mockGetByPixKeyService,
      mockConfirmOwnershipPixKeyService,
      mockReadyOwnershipPixKeyService,
      mockCompleteOwnershipPixKeyService,
      mockWaitOwnershipPixKeyService,
      mockCancelPortabilityPixKeyService,
      mockReadyPortabilityPixKeyService,
      mockConfirmPortabilityPixKeyService,
      mockCompletePortabilityPixKeyService,
      mockCompleteClaimClosingPixKeyService,
      mockCancelOwnershipPixKeyService,
    } = mockPixKeyService();
    const sut = new HandleNotifyClaimTopazioEventUseCase(
      logger,
      pixKeyService,
      notifyClaimRepository,
    );

    return {
      sut,
      mockGetByPixKeyService,
      mockConfirmOwnershipPixKeyService,
      mockReadyOwnershipPixKeyService,
      mockCompleteOwnershipPixKeyService,
      mockWaitOwnershipPixKeyService,
      mockCancelPortabilityPixKeyService,
      mockReadyPortabilityPixKeyService,
      mockConfirmPortabilityPixKeyService,
      mockCompletePortabilityPixKeyService,
      mockCompleteClaimClosingPixKeyService,
      mockCancelOwnershipPixKeyService,
      mockCreateRepository,
    };
  };

  const mockRepository = () => {
    const notifyClaimRepository: NotifyClaimRepository =
      createMock<NotifyClaimRepository>();
    const mockCreateRepository: jest.Mock = On(notifyClaimRepository).get(
      method((mock) => mock.create),
    );
    return { notifyClaimRepository, mockCreateRepository };
  };

  const mockPixKeyService = () => {
    const pixKeyService: PixKeyServiceKafka = createMock<PixKeyServiceKafka>();
    const mockGetByPixKeyService: jest.Mock = On(pixKeyService).get(
      method((mock) => mock.getPixKeyByKey),
    );
    const mockConfirmOwnershipPixKeyService: jest.Mock = On(pixKeyService).get(
      method((mock) => mock.confirmOwnershipClaim),
    );
    const mockReadyOwnershipPixKeyService: jest.Mock = On(pixKeyService).get(
      method((mock) => mock.readyOwnershipClaim),
    );
    const mockCompleteOwnershipPixKeyService: jest.Mock = On(pixKeyService).get(
      method((mock) => mock.completeOwnershipClaim),
    );
    const mockWaitOwnershipPixKeyService: jest.Mock = On(pixKeyService).get(
      method((mock) => mock.waitOwnershipClaim),
    );
    const mockCancelPortabilityPixKeyService: jest.Mock = On(pixKeyService).get(
      method((mock) => mock.cancelPortabilityClaim),
    );
    const mockReadyPortabilityPixKeyService: jest.Mock = On(pixKeyService).get(
      method((mock) => mock.readyPortabilityClaim),
    );
    const mockConfirmPortabilityPixKeyService: jest.Mock = On(
      pixKeyService,
    ).get(method((mock) => mock.confirmPortabilityClaim));
    const mockCompletePortabilityPixKeyService: jest.Mock = On(
      pixKeyService,
    ).get(method((mock) => mock.completePortabilityClaim));
    const mockCompleteClaimClosingPixKeyService: jest.Mock = On(
      pixKeyService,
    ).get(method((mock) => mock.completeClaimClosing));
    const mockCancelOwnershipPixKeyService: jest.Mock = On(pixKeyService).get(
      method((mock) => mock.cancelOwnershipClaim),
    );

    return {
      pixKeyService,
      mockGetByPixKeyService,
      mockConfirmOwnershipPixKeyService,
      mockReadyOwnershipPixKeyService,
      mockCompleteOwnershipPixKeyService,
      mockWaitOwnershipPixKeyService,
      mockCancelPortabilityPixKeyService,
      mockReadyPortabilityPixKeyService,
      mockConfirmPortabilityPixKeyService,
      mockCompletePortabilityPixKeyService,
      mockCompleteClaimClosingPixKeyService,
      mockCancelOwnershipPixKeyService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not notify without valid request', async () => {
      const { sut, mockGetByPixKeyService } = makeSut();

      const notifyClaim = new NotifyClaimEntity({ branch: 'test' });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not notify when pix key not found', async () => {
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(undefined);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid to save database', () => {
    it('TC0002 - Should save', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED },
      );
      const { sut, mockGetByPixKeyService, mockCreateRepository } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With status PORTABILITY_STARTED', () => {
    it('TC0003 - when donation is true - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - when claimType is OWNERSHIP - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - when Donation is true and claimType is Portability and claimStatus is WAITING_RESOLUTION - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: true,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - when Donation is true and claimType is Portability and claimStatus is COMPLETED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompletePortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.COMPLETED,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockCompletePortabilityPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - when Donation is true and claimType is Portability and claimStatus is OPEN - Indepotent', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockConfirmPortabilityPixKeyService,
        mockCancelPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.OPEN,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockConfirmPortabilityPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - when Donation is true and claimType is Portability and claimStatus is CONFIRMED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockConfirmPortabilityPixKeyService,
        mockCancelPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockConfirmPortabilityPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCancelPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - when Donation is true and claimType is Portability and claimStatus is CANCELLED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockConfirmPortabilityPixKeyService,
        mockCancelPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CANCELLED,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockConfirmPortabilityPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With status PORTABILITY_CONFIRMED', () => {
    it('TC0010 - when donation is true - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_CONFIRMED },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0011 - when claimType is OWNERSHIP - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_CONFIRMED },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0012 - when Donation is true and claimType is Portability and claimStatus is WAITING_RESOLUTION - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_CONFIRMED },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: false,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0013 - when Donation is true and claimType is Portability and claimStatus is OPEN - Indepotent', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_CONFIRMED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompletePortabilityPixKeyService,
        mockCancelPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.OPEN,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompletePortabilityPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0014 - when Donation is true and claimType is Portability and claimStatus is CONFIRMED - Indepotent', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_CONFIRMED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompletePortabilityPixKeyService,
        mockCancelPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompletePortabilityPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0015 - when Donation is true and claimType is Portability and claimStatus is COMPLETED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_CONFIRMED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompletePortabilityPixKeyService,
        mockCancelPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.COMPLETED,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompletePortabilityPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCancelPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0016 - when Donation is true and claimType is Portability and claimStatus is CANCELLED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_CONFIRMED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompletePortabilityPixKeyService,
        mockCancelPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CANCELLED,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompletePortabilityPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With status OWNERSHIP_STARTED', () => {
    it('TC0017 - when donation is true - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_STARTED },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0018 - when claimType is PORTABILITY - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_STARTED },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0019 - When Donation is true and claimType is Ownership and claimStatus is COMPLETED - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_STARTED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompleteOwnershipPixKeyService,
        mockConfirmOwnershipPixKeyService,
        mockWaitOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.COMPLETED,
        donation: false,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompleteOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockConfirmOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockWaitOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0020 - when Donation is true and claimType is Ownership and claimStatus is OPEN - Indepotent', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_STARTED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockConfirmOwnershipPixKeyService,
        mockWaitOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.OPEN,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockConfirmOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockWaitOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0021 - when Donation is true and claimType is Ownership and claimStatus is WAITING_RESOLUTION - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_STARTED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockConfirmOwnershipPixKeyService,
        mockWaitOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockConfirmOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockWaitOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0022 - when Donation is true and claimType is Ownership and claimStatus is CONFIRMED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_STARTED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockConfirmOwnershipPixKeyService,
        mockWaitOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockConfirmOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockWaitOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0023 - when Donation is true and claimType is Ownership and claimStatus is CANCELED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_STARTED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockConfirmOwnershipPixKeyService,
        mockWaitOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CANCELLED,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockConfirmOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockWaitOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With status OWNERSHIP_WAITING', () => {
    it('TC0024 - when donation is true - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_WAITING },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0025 - when claimType is PORTABILITY - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_WAITING },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0026 - when Donation is true and claimType is Ownership and claimStatus is COMPLETED - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_WAITING },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.COMPLETED,
        donation: false,
      });

      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0027 - when Donation is true and claimType is Ownership and claimStatus is OPEN - Indepotent', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_WAITING },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockConfirmOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.OPEN,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockConfirmOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0028 - when Donation is true and claimType is Ownership and claimStatus is WAITING_RESOLUTION - Indepotent', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_WAITING },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockConfirmOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockConfirmOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0029 - when Donation is true and claimType is Ownership and claimStatus is CONFIRMED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_WAITING },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockConfirmOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockConfirmOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0030 - when Donation is true and claimType is Ownership and claimStatus is CANCELED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_WAITING },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockConfirmOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CANCELLED,
        donation: false,
      });

      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockConfirmOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With status OWNERSHIP_CONFIRMED', () => {
    it('TC0031 - when donation is true - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_CONFIRMED },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0032 - when claimType is PORTABILITY - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_CONFIRMED },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0033 - when Donation is true and claimType is Ownership and claimStatus is OPEN - Indepotent', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_CONFIRMED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompleteOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.OPEN,
        donation: false,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompleteOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0034 - when Donation is true and claimType is Ownership and claimStatus is WAITING_RESOLUTION - Indepotent', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_CONFIRMED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompleteOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: false,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompleteOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0035 - when Donation is true and claimType is Ownership and claimStatus is CONFIRMED - Indepotent', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_CONFIRMED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompleteOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompleteOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0036 - when Donation is true and claimType is Ownership and claimStatus is CANCELED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_CONFIRMED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompleteOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CANCELLED,
        donation: false,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompleteOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0037 - when Donation is true and claimType is Ownership and claimStatus is COMPLETED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_CONFIRMED },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompleteOwnershipPixKeyService,
        mockCancelOwnershipPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.COMPLETED,
        donation: false,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompleteOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCancelOwnershipPixKeyService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With status READY', () => {
    it('TC0038 - when donation is false - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0039 - when claimStatus is COMPLETED - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.COMPLETED,
        donation: true,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0040 - when claimStatus is CANCELLED - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CANCELLED,
        donation: true,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0041 - when Donation is false and claimType is Ownership and claimStatus is OPEN - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.OPEN,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0042 - when Donation is false and claimType is Ownership and claimStatus is WAITING_RESOLUTION - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0043 - when Donation is false and claimType is Ownership and claimStatus is CONFIRMED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0044 - when Donation is false and claimType is Portability and claimStatus is OPEN - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.OPEN,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0045 - when Donation is false and claimType is Portability and claimStatus is WAITING_RESOLUTION - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0046 - when Donation is false and claimType is Portability and claimStatus is CONFIRMED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With status ADD_KEY_READY', () => {
    it('TC0047 - when donation is false - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.ADD_KEY_READY },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0048 - when claimStatus is COMPLETED - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.ADD_KEY_READY },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.COMPLETED,
        donation: true,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0049 - when claimStatus is CANCELLED - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.ADD_KEY_READY },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CANCELLED,
        donation: true,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0050 - when Donation is false and claimType is Ownership and claimStatus is OPEN - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.ADD_KEY_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.OPEN,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0051 - when Donation is false and claimType is Ownership and claimStatus is WAITING_RESOLUTION - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.ADD_KEY_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0052 - when Donation is false and claimType is Ownership and claimStatus is CONFIRMED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.ADD_KEY_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0053 - when Donation is false and claimType is Portability and claimStatus is OPEN - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.ADD_KEY_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.OPEN,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0054 - when Donation is false and claimType is Portability and claimStatus is WAITING_RESOLUTION - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.ADD_KEY_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0055 - when Donation is false and claimType is Portability and claimStatus is CONFIRMED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.ADD_KEY_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With status PORTABILITY_READY', () => {
    it('TC0056 - when donation is false - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_READY },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0057 - when claimStatus is COMPLETED - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_READY },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.COMPLETED,
        donation: true,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0058 - when claimStatus is CANCELLED - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_READY },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CANCELLED,
        donation: true,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0059 - when Donation is false and claimType is Ownership and claimStatus is OPEN - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.OPEN,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0060 - when Donation is false and claimType is Ownership and claimStatus is WAITING_RESOLUTION - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0061 - when Donation is false and claimType is Ownership and claimStatus is CONFIRMED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0062 - when Donation is false and claimType is Portability and claimStatus is OPEN - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.OPEN,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0063 - when Donation is false and claimType is Portability and claimStatus is WAITING_RESOLUTION - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0064 - when Donation is false and claimType is Portability and claimStatus is CONFIRMED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With status OWNERSHIP_READY', () => {
    it('TC0065 - when donation is false - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_READY },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0066 - when claimStatus is COMPLETED - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_READY },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.COMPLETED,
        donation: true,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0067 - when claimStatus is CANCELLED - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_READY },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CANCELLED,
        donation: true,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0068 - when Donation is false and claimType is Ownership and claimStatus is OPEN - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.OPEN,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0069 - when Donation is false and claimType is Ownership and claimStatus is WAITING_RESOLUTION - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0070 - when Donation is false and claimType is Ownership and claimStatus is CONFIRMED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0071 - when Donation is false and claimType is Portability and claimStatus is OPEN - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.OPEN,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0072 - when Donation is false and claimType is Portability and claimStatus is WAITING_RESOLUTION - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0073 - when Donation is false and claimType is Portability and claimStatus is CONFIRMED - send message to pix key', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_READY },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockReadyOwnershipPixKeyService,
        mockReadyPortabilityPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockReadyPortabilityPixKeyService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With status CLAIM_CLOSING', () => {
    it('TC0074 - when donation is false - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.CLAIM_CLOSING },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: false,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0075 - when claimType is PORTABILITY - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.CLAIM_CLOSING },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.PORTABILITY,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0076 - when claimStatus is CANCELED - Send msg error', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.CLAIM_CLOSING },
      );
      const { sut, mockGetByPixKeyService } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CANCELLED,
        donation: true,
      });
      const testScript = () => sut.execute(notifyClaim);

      await expect(testScript).rejects.toThrow(NotifyClaimInvalidFlowException);
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0077 - when Donation is false and claimType is Ownership and claimStatus is OPEN - Indepotent', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.CLAIM_CLOSING },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompleteClaimClosingPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.OPEN,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompleteClaimClosingPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0078 - when Donation is false and claimType is Ownership and claimStatus is WAITING_RESOLUTION - Indepotent', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.CLAIM_CLOSING },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompleteClaimClosingPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.WAITING_RESOLUTION,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompleteClaimClosingPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0079 - when Donation is false and claimType is Ownership and claimStatus is CONFIRMED - Indepotent', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.CLAIM_CLOSING },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompleteClaimClosingPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.CONFIRMED,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompleteClaimClosingPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0080 - when Donation is false and claimType is Ownership and claimStatus is COMPLETED - send message to pix key ', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.CLAIM_CLOSING },
      );
      const {
        sut,
        mockGetByPixKeyService,
        mockCompleteClaimClosingPixKeyService,
      } = makeSut();
      mockGetByPixKeyService.mockReturnValue(pixKey);

      const notifyClaim = new NotifyClaimEntity({
        id: uuidV4(),
        key: 'test',
        claimType: ClaimType.OWNERSHIP,
        status: ClaimStatusType.COMPLETED,
        donation: true,
      });
      const result = await sut.execute(notifyClaim);

      expect(result).toBeUndefined();
      expect(mockGetByPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockCompleteClaimClosingPixKeyService).toHaveBeenCalledTimes(1);
    });
  });
});
