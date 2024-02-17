import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  SignupEntity,
  SignupRepository,
  SignupState,
} from '@zro/signup/domain';
import {
  UpdateSignupUseCase as UseCase,
  SignupInvalidStateException,
  SignupNotFoundException,
} from '@zro/signup/application';
import { SignupFactory } from '@zro/test/signup/config';

describe('UpdateSignupUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const signupRepository: SignupRepository = createMock<SignupRepository>();
    const mockUpdateSignupRepository: jest.Mock = On(signupRepository).get(
      method((mock) => mock.update),
    );
    const mockGetByIdSignupRepository: jest.Mock = On(signupRepository).get(
      method((mock) => mock.getById),
    );
    const sut = new UseCase(logger, signupRepository);
    return {
      sut,
      mockUpdateSignupRepository,
      mockGetByIdSignupRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update signup if missing params', async () => {
      const { sut, mockUpdateSignupRepository, mockGetByIdSignupRepository } =
        makeSut();

      const test = () => sut.execute(new SignupEntity({ id: null }));
      await expect(test).rejects.toThrow(MissingDataException);

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should not update if do not find signup', async () => {
      const { sut, mockUpdateSignupRepository, mockGetByIdSignupRepository } =
        makeSut();

      const failedSignup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.PENDING, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValue(undefined);

      const updatedFailedSignup = () => sut.execute(failedSignup);
      await expect(updatedFailedSignup).rejects.toThrow(
        SignupNotFoundException,
      );

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update if status is not pending', async () => {
      const { sut, mockGetByIdSignupRepository, mockUpdateSignupRepository } =
        makeSut();

      const invalidState = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.READY, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(invalidState);

      const updatedInvalidState = () => sut.execute(invalidState);
      await expect(updatedInvalidState).rejects.toThrow(
        SignupInvalidStateException,
      );

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateSignupRepository).toHaveBeenCalledTimes(0);
      expect(invalidState).toBeTruthy;
      expect(invalidState).toBeDefined();
      expect(invalidState.referralCode).toBeNull();
      expect(invalidState.state).not.toBe(SignupState.PENDING);
      expect(invalidState.confirmCode).toBeDefined();
    });

    it('TC0004 - Should find signup and update', async () => {
      const { sut, mockGetByIdSignupRepository, mockUpdateSignupRepository } =
        makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { state: SignupState.PENDING, referralCode: null },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(signup);
      mockUpdateSignupRepository.mockResolvedValueOnce(signup);

      const updatedSignup = await sut.execute(signup);

      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
      expect(updatedSignup).toBeTruthy;
      expect(updatedSignup).toBeDefined();
      expect(updatedSignup.referralCode).toBeNull();
      expect(updatedSignup.state).toBe(SignupState.PENDING);
      expect(updatedSignup.confirmCode).toBeDefined();
    });
  });
});
