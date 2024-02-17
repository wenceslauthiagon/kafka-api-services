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
  CreateSignupUseCase as UseCase,
  UserService,
} from '@zro/signup/application';
import { SignupFactory } from '@zro/test/signup/config';
import { UserEntity } from '@zro/users/domain';
import { UserFactory } from '@zro/test/users/config';

describe('CreateSignupUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const signupRepository: SignupRepository = createMock<SignupRepository>();
    const mockCreateSignupRepository: jest.Mock = On(signupRepository).get(
      method((mock) => mock.create),
    );
    const mockGetByIdSignupRepository: jest.Mock = On(signupRepository).get(
      method((mock) => mock.getById),
    );

    const userService: UserService = createMock<UserService>();
    const mockGetUserByEmail: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByEmail),
    );

    const sut = new UseCase(logger, signupRepository, userService);

    return {
      sut,
      mockCreateSignupRepository,
      mockGetByIdSignupRepository,
      mockGetUserByEmail,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create signup if missing params.', async () => {
      const {
        sut,
        mockCreateSignupRepository,
        mockGetByIdSignupRepository,
        mockGetUserByEmail,
      } = makeSut();

      const signups = [
        new SignupEntity({}),
        new SignupEntity({ id: faker.datatype.uuid() }),
        new SignupEntity({ email: faker.internet.email() }),
      ];

      const test = signups.map((signup) => sut.execute(signup));

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw SignupEmailAlreadyInUseException is email is already in use.', async () => {
      const {
        sut,
        mockCreateSignupRepository,
        mockGetByIdSignupRepository,
        mockGetUserByEmail,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetByIdSignupRepository.mockResolvedValueOnce(null);
      mockGetUserByEmail.mockResolvedValueOnce(user);

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { referralCode: null, email: user.email },
      );

      const result = await sut.execute(signup);
      expect(result).toBeUndefined();
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should create signup successfully.', async () => {
      const {
        sut,
        mockCreateSignupRepository,
        mockGetByIdSignupRepository,
        mockGetUserByEmail,
      } = makeSut();

      mockCreateSignupRepository.mockImplementationOnce((signup) => signup);
      mockGetByIdSignupRepository.mockResolvedValueOnce(null);
      mockGetUserByEmail.mockResolvedValueOnce(null);

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { referralCode: null },
      );

      const createdSignup = await sut.execute(signup);

      expect(createdSignup).toBeDefined();
      expect(createdSignup.referralCode).toBeNull();
      expect(createdSignup.state).toBe(SignupState.PENDING);
      expect(createdSignup.confirmCode).toBeDefined();
      expect(mockCreateSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should return existent signup.', async () => {
      const {
        sut,
        mockCreateSignupRepository,
        mockGetByIdSignupRepository,
        mockGetUserByEmail,
      } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { referralCode: null, state: SignupState.DUPLICATED },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(signup);

      const foundSignup = await sut.execute(signup);

      expect(foundSignup).toBeDefined();
      expect(foundSignup.referralCode).toBeNull();
      expect(foundSignup.state).toBe(SignupState.DUPLICATED);
      expect(foundSignup.confirmCode).toBeDefined();
      expect(mockCreateSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(0);
    });
  });
});
