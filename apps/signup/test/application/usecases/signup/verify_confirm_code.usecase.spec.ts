import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  SignupEntity,
  SignupRepository,
  SignupState,
} from '@zro/signup/domain';
import {
  VerifyConfirmCodeSignupUseCase as UseCase,
  SignupEventEmitter,
  SignupInvalidStateException,
  SignupNotFoundException,
} from '@zro/signup/application';
import { SignupFactory } from '@zro/test/signup/config';

describe('VerifyConfirmCodeSignupUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const signupRepository: SignupRepository = createMock<SignupRepository>();
    const mockGetByIdSignupRepository: jest.Mock = On(signupRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateSignupRepository: jest.Mock = On(signupRepository).get(
      method((mock) => mock.update),
    );

    const signupEventEmitter: SignupEventEmitter =
      createMock<SignupEventEmitter>();
    const mockConfirmSignupEventEmitter: jest.Mock = On(signupEventEmitter).get(
      method((mock) => mock.confirmSignup),
    );
    const mockNotConfirmSignupEventEmitter: jest.Mock = On(
      signupEventEmitter,
    ).get(method((mock) => mock.notConfirmSignup));

    const maxNumberOfAttempts = 10;

    const sut = new UseCase(
      logger,
      signupRepository,
      maxNumberOfAttempts,
      signupEventEmitter,
    );
    return {
      sut,
      mockGetByIdSignupRepository,
      mockUpdateSignupRepository,
      mockConfirmSignupEventEmitter,
      mockNotConfirmSignupEventEmitter,
      maxNumberOfAttempts,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not execute if missing params', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockConfirmSignupEventEmitter,
        mockNotConfirmSignupEventEmitter,
      } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.PENDING, referralCode: null },
      );

      const test = [
        () => sut.execute(null, null),
        () => sut.execute(new SignupEntity({ ...signup }), null),
        () => sut.execute(null, 'test'),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockNotConfirmSignupEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should throw error if did not find signup', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockConfirmSignupEventEmitter,
        mockNotConfirmSignupEventEmitter,
      } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.PENDING, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValue(undefined);

      const confirmCode = 'test';

      const test = () => sut.execute(signup, confirmCode);
      await expect(test).rejects.toThrow(SignupNotFoundException);

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(confirmCode).toBeDefined();
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockNotConfirmSignupEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw error if found signup status is not pending', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockConfirmSignupEventEmitter,
        mockNotConfirmSignupEventEmitter,
      } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.DUPLICATED, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValue(signup);

      const confirmCode = 'test';

      const test = () => sut.execute(signup, confirmCode);
      await expect(test).rejects.toThrow(SignupInvalidStateException);

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(confirmCode).toBeDefined();
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockNotConfirmSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(signup.state).not.toBe(SignupState.PENDING);
    });

    it('TC0004 - Should not execute if found signup has invalid params', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockConfirmSignupEventEmitter,
        mockNotConfirmSignupEventEmitter,
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
          const testCallFunc = sut.execute(foundSignup, 'test');
          await expect(testCallFunc).rejects.toThrow(MissingDataException);
        }),
      );

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(4);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockNotConfirmSignupEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - should write verify code error into logger.info if foundSignup.confirmAttempts > maxNumberOfAttempts ', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockConfirmSignupEventEmitter,
        mockNotConfirmSignupEventEmitter,
      } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.PENDING, referralCode: null, confirmAttempts: 11 },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(signup);

      const confirmCode = 'test';

      const test = await sut.execute(signup, confirmCode);

      expect(test).toBeDefined();
      expect(signup.state).toBe(SignupState.PENDING);
      expect(signup.confirmCode).toBeDefined();
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockNotConfirmSignupEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - should update found signup status to CONFIRMED and emmit event confirmSignup if confirmCodes are equal', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockConfirmSignupEventEmitter,
        mockNotConfirmSignupEventEmitter,
      } = makeSut();

      const foundSignup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        {
          state: SignupState.PENDING,
          referralCode: null,
          confirmCode: 'testOK',
          confirmAttempts: 5,
        },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(foundSignup);

      const confirmCode = 'testOK';

      const test = await sut.execute(foundSignup, confirmCode);

      expect(test).toBeDefined();
      expect(foundSignup.state).toBe(SignupState.CONFIRMED);
      expect(foundSignup.confirmCode).toBe(confirmCode);
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockConfirmSignupEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockNotConfirmSignupEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - should increment confirmAttempts if confirmCodes are not equal. If new confirmAttempts excedes maxNumberOfAttemps, should change state to NOT_CONFIRMED plus emmit event notConfirmSignup', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockConfirmSignupEventEmitter,
        mockNotConfirmSignupEventEmitter,
      } = makeSut();

      const foundSignup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        {
          state: SignupState.PENDING,
          referralCode: null,
          confirmCode: 'testNotOK',
          confirmAttempts: 9,
        },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(foundSignup);

      const confirmCode = 'testOK';

      const test = await sut.execute(foundSignup, confirmCode);

      expect(foundSignup.confirmAttempts).toEqual(10);
      expect(test).toBeDefined();
      expect(foundSignup.state).toBe(SignupState.NOT_CONFIRMED);
      expect(foundSignup.confirmCode).not.toBe(confirmCode);
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockConfirmSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockNotConfirmSignupEventEmitter).toHaveBeenCalledTimes(1);
    });
  });
});
