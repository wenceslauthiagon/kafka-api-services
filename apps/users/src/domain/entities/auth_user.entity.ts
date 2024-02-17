import { User, UserApiKey } from '@zro/users/domain';

export type AuthUser = Pick<
  User,
  | 'id'
  | 'uuid'
  | 'pin'
  | 'pinHasCreated'
  | 'phoneNumber'
  | 'active'
  | 'email'
  | 'password'
  | 'type'
> & { apiId?: UserApiKey['id'] };
