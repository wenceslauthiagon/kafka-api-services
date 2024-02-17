import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  SignupEntity,
  SignupRepository,
  SignupState,
} from '@zro/signup/domain';
import { GetSignupByIdUseCase as UseCase } from '@zro/signup/application';
import { SignupFactory } from '@zro/test/signup/config';

describe('GetSignupByIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const signupRepository: SignupRepository = createMock<SignupRepository>();
    const mockGetByIdSignupRepository: jest.Mock = On(signupRepository).get(
      method((mock) => mock.getById),
    );
    const sut = new UseCase(logger, signupRepository);
    return {
      sut,
      mockGetByIdSignupRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not return signup if missing id', async () => {
      const { sut, mockGetByIdSignupRepository } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should return existent signup', async () => {
      const { sut, mockGetByIdSignupRepository } = makeSut();

      const signup = await SignupFactory.create<SignupEntity>(
        SignupEntity.name,
        { referralCode: null, state: SignupState.PENDING },
      );

      mockGetByIdSignupRepository.mockResolvedValueOnce(signup);

      const result = await sut.execute(signup.id);

      expect(result).toBeTruthy;
      expect(result).toBeDefined();
      expect(result.referralCode).toBeNull();
      expect(result.state).toBe(SignupState.PENDING);
      expect(result.confirmCode).toBeDefined();
      expect(mockGetByIdSignupRepository).toHaveBeenCalledTimes(1);
    });
  });
});
