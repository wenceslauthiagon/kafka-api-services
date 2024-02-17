import { UserModel } from '@zro/users/infrastructure';
import { UserFactory } from '@zro/test/users/config';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';

interface UserAndToken {
  user: UserModel;
  token: string;
}

export const createUserAndToken = async (
  tokenProvider: AccessTokenProvider,
): Promise<UserAndToken> => {
  const user = await UserFactory.create<UserModel>(UserModel.name);
  const token = `Bearer ${tokenProvider.generateAccessToken(user)}`;
  return { user, token };
};
