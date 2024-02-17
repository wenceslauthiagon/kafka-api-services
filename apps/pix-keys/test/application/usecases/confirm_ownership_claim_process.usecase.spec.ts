import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  KeyState,
  PixKeyClaimEntity,
  PixKeyEntity,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  ConfirmOwnershipClaimProcessUseCase,
  PixKeyEventEmitter,
  PixKeyNotFoundException,
  PixKeyInvalidStateException,
  PixKeyGateway,
} from '@zro/pix-keys/application';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

describe('ConfirmOwnershipClaimProcessUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const ZRO_ISPB = '26264220';

    const { eventEmitter, mockOwnershipConfirmPixKeyEvent } = mockEvent();
    const { pixKeyRepository, mockGetRepository, mockUpdateRepository } =
      mockRepository();

    const pspGateway: PixKeyGateway = createMock<PixKeyGateway>();
    const mockFinishClaimPixKeyPixKeyPspGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.finishClaimPixKey),
    );

    const sut = new ConfirmOwnershipClaimProcessUseCase(
      logger,
      pixKeyRepository,
      eventEmitter,
      pspGateway,
      ZRO_ISPB,
    );

    return {
      sut,
      mockOwnershipConfirmPixKeyEvent,
      mockGetRepository,
      mockUpdateRepository,
      mockFinishClaimPixKeyPixKeyPspGateway,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockOwnershipConfirmPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.ownershipConfirmedPixKey),
    );
    return {
      eventEmitter,
      mockOwnershipConfirmPixKeyEvent,
    };
  };

  const mockRepository = () => {
    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getByKeyAndStateIsNotCanceled),
    );
    const mockUpdateRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.update),
    );

    return { pixKeyRepository, mockGetRepository, mockUpdateRepository };
  };

  describe('With invalid called', () => {
    it('TC0001 - Should not confirm ownership without key', async () => {
      const {
        sut,
        mockOwnershipConfirmPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockFinishClaimPixKeyPixKeyPspGateway,
      } = makeSut();

      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockOwnershipConfirmPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockFinishClaimPixKeyPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not confirm ownership when pix key not found', async () => {
      const {
        sut,
        mockOwnershipConfirmPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockFinishClaimPixKeyPixKeyPspGateway,
      } = makeSut();

      const { key } = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockResolvedValue([]);

      const testScript = () => sut.execute(key);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      expect(mockOwnershipConfirmPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockFinishClaimPixKeyPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not confirm ownership when state is already OWNERSHIP_CONFIRMED', async () => {
      const {
        sut,
        mockOwnershipConfirmPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockFinishClaimPixKeyPixKeyPspGateway,
      } = makeSut();

      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_CONFIRMED },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);

      expect(pixKey.state).toEqual(KeyState.OWNERSHIP_CONFIRMED);
      expect(mockOwnershipConfirmPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockFinishClaimPixKeyPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not confirm ownership when state is not OWNERSHIP_STARTED | OWNERSHIP_WAITING', async () => {
      const {
        sut,
        mockOwnershipConfirmPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockFinishClaimPixKeyPixKeyPspGateway,
      } = makeSut();

      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PENDING },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const testScript = () => sut.execute(pixKeyData.key);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockOwnershipConfirmPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockFinishClaimPixKeyPixKeyPspGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid called', () => {
    it('TC0005 - Should confirm ownership when state is OWNERSHIP_STARTED', async () => {
      const {
        sut,
        mockOwnershipConfirmPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockFinishClaimPixKeyPixKeyPspGateway,
      } = makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );
      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_STARTED, claim },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);

      expect(pixKey).toBeDefined();
      expect(pixKey.state).toBe(KeyState.OWNERSHIP_CONFIRMED);
      expect(mockOwnershipConfirmPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(pixKey);
      expect(mockFinishClaimPixKeyPixKeyPspGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should cancel pix key when state is OWNERSHIP_WAITING', async () => {
      const {
        sut,
        mockOwnershipConfirmPixKeyEvent,
        mockGetRepository,
        mockUpdateRepository,
        mockFinishClaimPixKeyPixKeyPspGateway,
      } = makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );
      const pixKeyData = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.OWNERSHIP_WAITING, claim },
      );
      mockGetRepository.mockResolvedValue([pixKeyData]);

      const pixKey = await sut.execute(pixKeyData.key);

      expect(pixKey).toBeDefined();
      expect(pixKey.state).toBe(KeyState.OWNERSHIP_CONFIRMED);
      expect(mockOwnershipConfirmPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKeyData.key);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledWith(pixKey);
      expect(mockFinishClaimPixKeyPixKeyPspGateway).toHaveBeenCalledTimes(1);
    });
  });
});
