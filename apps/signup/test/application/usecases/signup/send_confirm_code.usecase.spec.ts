import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  SignupEntity,
  SignupRepository,
  SignupState,
} from '@zro/signup/domain';
import {
  SendConfirmCodeSignupUseCase as UseCase,
  NotificationService,
} from '@zro/signup/application';
import { SignupFactory } from '@zro/test/signup/config';

const EMAIL_TAG = 'teste';
const EMAIL_FROM = 'zrobank@test.com';

describe('SendConfirmCodeSignupUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const signupRepository: SignupRepository = createMock<SignupRepository>();
    const mockGetByIdSignupRepository: jest.Mock = On(signupRepository).get(
      method((mock) => mock.getById),
    );

    const notificationService: NotificationService =
      createMock<NotificationService>();
    const mockSendEmailCodeNotificationService: jest.Mock = On(
      notificationService,
    ).get(method((mock) => mock.sendEmailCode));

    const sut = new UseCase(
      logger,
      signupRepository,
      notificationService,
      EMAIL_TAG,
      EMAIL_FROM,
    );
    return {
      sut,
      mockGetByIdSignupRepository,
      mockSendEmailCodeNotificationService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not send signup confirm code if missing params', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockSendEmailCodeNotificationService,
      } = makeSut();

      const signup = new SignupEntity({});

      const test = () => sut.execute(signup);
      await expect(test).rejects.toThrow(MissingDataException);

      expect(signup).toBeInstanceOf(SignupEntity);
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockSendEmailCodeNotificationService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not send sms code if do not find signup', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockSendEmailCodeNotificationService,
      } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.PENDING, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValue(undefined);

      const result = await sut.execute(signup);
      expect(result).toBeUndefined();
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockSendEmailCodeNotificationService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not send sms code if status is not pending', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockSendEmailCodeNotificationService,
      } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.READY, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(signup);

      const result = await sut.execute(signup);

      expect(result).toBeUndefined();
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockSendEmailCodeNotificationService).toHaveBeenCalledTimes(0);
      expect(signup).toBeTruthy;
      expect(signup).toBeDefined();
      expect(signup.referralCode).toBeNull();
      expect(signup.state).not.toBe(SignupState.PENDING);
      expect(signup.confirmCode).toBeDefined();
    });

    it('TC0004 - Should not send sms code if find signup with invalid params', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockSendEmailCodeNotificationService,
      } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.PENDING, referralCode: null },
      );
      signup.isPending = () => true;

      const signups = [
        { ...signup, name: null },
        { ...signup, password: null },
        { ...signup, phoneNumber: null },
        { ...signup, email: null },
      ];

      Promise.all(
        signups.map(async (foundSignup: SignupEntity) => {
          mockGetByIdSignupRepository.mockResolvedValue(foundSignup);
          const testCallFunc = sut.execute(foundSignup);
          await expect(testCallFunc).rejects.toThrow(MissingDataException);
        }),
      );

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(4);
      expect(mockSendEmailCodeNotificationService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - should find signup and send code by email', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockSendEmailCodeNotificationService,
      } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { referralCode: null, state: SignupState.PENDING },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(signup);

      const test = await sut.execute(signup);

      expect(test).toBeUndefined();
      expect(signup.referralCode).toBeNull();
      expect(signup.state).toBe(SignupState.PENDING);
      expect(signup.confirmCode).toBeDefined();
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockSendEmailCodeNotificationService).toHaveBeenCalledTimes(1);
    });
  });
});
