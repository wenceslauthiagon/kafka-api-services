import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  SignupEntity,
  SignupRepository,
  SignupState,
} from '@zro/signup/domain';
import {
  HandleConfirmedSignupUseCase as UseCase,
  SignupNotFoundException,
  SignupInvalidStateException,
  UserService,
  SignupEventEmitter,
} from '@zro/signup/application';
import { UserAlreadyExistsException } from '@zro/users/application';
import { SignupFactory } from '@zro/test/signup/config';

describe('HandleConfirmedSignupUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const signupRepository: SignupRepository = createMock<SignupRepository>();
    const mockGetByIdSignupRepository: jest.Mock = On(signupRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateSignupRepository: jest.Mock = On(signupRepository).get(
      method((mock) => mock.update),
    );

    const userService: UserService = createMock<UserService>();
    const mockCreateUserUserService: jest.Mock = On(userService).get(
      method((mock) => mock.createUser),
    );

    const signupEventEmitter: SignupEventEmitter =
      createMock<SignupEventEmitter>();
    const mockDuplicateSignupEventEmitter: jest.Mock = On(
      signupEventEmitter,
    ).get(method((mock) => mock.duplicateSignup));
    const mockReadySignupEventEmitter: jest.Mock = On(signupEventEmitter).get(
      method((mock) => mock.readySignup),
    );

    const sut = new UseCase(
      logger,
      signupRepository,
      userService,
      signupEventEmitter,
    );
    return {
      sut,
      mockGetByIdSignupRepository,
      mockUpdateSignupRepository,
      mockCreateUserUserService,
      mockDuplicateSignupEventEmitter,
      mockReadySignupEventEmitter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not send signup confirm code if missing params', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockCreateUserUserService,
        mockDuplicateSignupEventEmitter,
        mockReadySignupEventEmitter,
      } = makeSut();

      const test = () => sut.execute(null);
      await expect(test).rejects.toThrow(MissingDataException);

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserUserService).toHaveBeenCalledTimes(0);
      expect(mockDuplicateSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockReadySignupEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should throw SignupNotFoundException if do not find signup', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockCreateUserUserService,
        mockDuplicateSignupEventEmitter,
        mockReadySignupEventEmitter,
      } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.PENDING, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValue(undefined);

      const test = () => sut.execute(signup);
      await expect(test).rejects.toThrow(SignupNotFoundException);

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserUserService).toHaveBeenCalledTimes(0);
      expect(mockDuplicateSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockReadySignupEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return foundSignup if state is final', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockCreateUserUserService,
        mockDuplicateSignupEventEmitter,
        mockReadySignupEventEmitter,
      } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.READY, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(signup);

      const test = await sut.execute(signup);

      expect(test).toBe(signup);
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserUserService).toHaveBeenCalledTimes(0);
      expect(mockDuplicateSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockReadySignupEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw exception if state is not confirmed', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockCreateUserUserService,
        mockDuplicateSignupEventEmitter,
        mockReadySignupEventEmitter,
      } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.PENDING, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(signup);

      const test = () => sut.execute(signup);
      await expect(test).rejects.toThrow(SignupInvalidStateException);

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserUserService).toHaveBeenCalledTimes(0);
      expect(mockDuplicateSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockReadySignupEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should create user, update status to ready and emmit event readySignup', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockCreateUserUserService,
        mockDuplicateSignupEventEmitter,
        mockReadySignupEventEmitter,
      } = makeSut();

      const foundSignup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.CONFIRMED, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(foundSignup);

      const userId = faker.datatype.uuid();
      mockCreateUserUserService.mockResolvedValueOnce({ id: userId });

      mockUpdateSignupRepository.mockResolvedValueOnce(foundSignup);

      const event = {
        id: foundSignup.id,
        state: foundSignup.state,
        phoneNumber: foundSignup.phoneNumber,
      };
      mockReadySignupEventEmitter.mockResolvedValueOnce(event);

      const test = await sut.execute(foundSignup);
      expect(test).toBeDefined;

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateUserUserService).toHaveBeenCalledTimes(1);
      expect(mockDuplicateSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockReadySignupEventEmitter).toHaveBeenCalledTimes(1);
      expect(foundSignup.state).toBe(SignupState.READY);
    });

    it('TC0006 - Should update foundSignup state and emmit event duplicateSignup if found signup is already a user', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockCreateUserUserService,
        mockDuplicateSignupEventEmitter,
        mockReadySignupEventEmitter,
      } = makeSut();

      const foundSignup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.CONFIRMED, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(foundSignup);
      mockCreateUserUserService.mockRejectedValueOnce(
        new UserAlreadyExistsException({ uuid: faker.datatype.uuid() }),
      );
      mockUpdateSignupRepository.mockResolvedValueOnce(foundSignup);

      const event = {
        id: foundSignup.id,
        state: foundSignup.state,
        phoneNumber: foundSignup.phoneNumber,
      };
      mockDuplicateSignupEventEmitter.mockResolvedValueOnce(event);

      const test = await sut.execute(foundSignup);
      expect(test).toBeDefined;

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateUserUserService).toHaveBeenCalledTimes(1);
      expect(mockDuplicateSignupEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockReadySignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(foundSignup.state).toBe(SignupState.DUPLICATED);
    });

    it('TC0007 - Should throw error if createUser function fails', async () => {
      const {
        sut,
        mockGetByIdSignupRepository,
        mockUpdateSignupRepository,
        mockCreateUserUserService,
        mockDuplicateSignupEventEmitter,
        mockReadySignupEventEmitter,
      } = makeSut();

      const foundSignup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.CONFIRMED, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(foundSignup);

      mockCreateUserUserService.mockRejectedValue(new Error('Async error'));

      const test = () => sut.execute(foundSignup);
      await expect(test).rejects.toThrow('Async error');

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserUserService).toHaveBeenCalledTimes(1);
      expect(mockDuplicateSignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockReadySignupEventEmitter).toHaveBeenCalledTimes(0);
      expect(foundSignup.state).toBe(SignupState.CONFIRMED);
    });
  });
});
