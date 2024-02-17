import { AdminModel } from '@zro/admin/infrastructure';
import { AdminFactory } from '@zro/test/admin/config';
import { AccessTokenProvider } from '@zro/api-admin/infrastructure';

interface AdminAndToken {
  admin: AdminModel;
  token: string;
}

export const createAdminAndToken = async (
  tokenProvider: AccessTokenProvider,
): Promise<AdminAndToken> => {
  const admin = await AdminFactory.create<AdminModel>(AdminModel.name);
  const token = `Bearer ${tokenProvider.generateAccessToken(admin)}`;
  return { admin, token };
};
