import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  KeyState,
  PixKeyClaimEntity,
  PixKeyClaimRepository,
  PixKeyEntity,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  HandlePortabilityRequestConfirmStartedPixKeyEventUseCase as UseCase,
  PixKeyEventEmitter,
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';
import { faker } from '@faker-js/faker/locale/pt_BR';

describe('HandlePortabilityRequestConfirmStartedPixKeyEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { eventEmitter, mockCanceledPixKeyEvent } = mockEvent();
    const {
      pixKeyRepository,
      mockGetByIdPixKeyRepository,
      mockUpdatePixKeyRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );
    return {
      sut,
      mockCanceledPixKeyEvent,
      mockGetByIdPixKeyRepository,
      mockUpdatePixKeyRepository,
      mockUpdatePixKeyClaimRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: PixKeyEventEmitter = createMock<PixKeyEventEmitter>();
    const mockCanceledPixKeyEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.canceledPixKey),
    );
    return {
      eventEmitter,
      mockCanceledPixKeyEvent,
    };
  };

  const mockRepository = () => {
    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetByIdPixKeyRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdatePixKeyRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.update),
    );

    const pixKeyClaimRepository: PixKeyClaimRepository =
      createMock<PixKeyClaimRepository>();
    const mockUpdatePixKeyClaimRepository: jest.Mock = On(
      pixKeyClaimRepository,
    ).get(method((mock) => mock.update));

    return {
      pixKeyRepository,
      mockGetByIdPixKeyRepository,
      mockUpdatePixKeyRepository,
      pixKeyClaimRepository,
      mockUpdatePixKeyClaimRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should cancel a key successfully', async () => {
      const {
        sut,
        mockCanceledPixKeyEvent,
        mockGetByIdPixKeyRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
      );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.PORTABILITY_REQUEST_CONFIRM_STARTED, claim },
      );

      mockGetByIdPixKeyRepository.mockResolvedValue(pixKey);

      await sut.execute(pixKey.id);

      expect(mockGetByIdPixKeyRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(1);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should return a key already canceled', async () => {
      const {
        sut,
        mockCanceledPixKeyEvent,
        mockGetByIdPixKeyRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.CANCELED },
      );

      mockGetByIdPixKeyRepository.mockResolvedValue(pixKey);

      await sut.execute(pixKey.id);

      expect(mockGetByIdPixKeyRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should throw MissingDataException when id missing', async () => {
      const {
        sut,
        mockCanceledPixKeyEvent,
        mockGetByIdPixKeyRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const testScript = () => sut.execute(null);

      expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdPixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw PixKeyNotFoundException when pixKey not found', async () => {
      const {
        sut,
        mockCanceledPixKeyEvent,
        mockGetByIdPixKeyRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      mockGetByIdPixKeyRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(faker.datatype.uuid());

      expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      expect(mockGetByIdPixKeyRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw PixKeyInvalidStateException when state is not PORTABILITY_REQUEST_CONFIRM_STARTED', async () => {
      const {
        sut,
        mockCanceledPixKeyEvent,
        mockGetByIdPixKeyRepository,
        mockUpdatePixKeyRepository,
        mockUpdatePixKeyClaimRepository,
      } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );

      mockGetByIdPixKeyRepository.mockResolvedValue(pixKey);

      const testScript = () => sut.execute(pixKey.id);

      expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockGetByIdPixKeyRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixKeyRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixKeyClaimRepository).toHaveBeenCalledTimes(0);
      expect(mockCanceledPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });
});
