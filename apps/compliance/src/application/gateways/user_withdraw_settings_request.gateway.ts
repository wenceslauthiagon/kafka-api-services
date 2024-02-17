import { UserWithdrawSettingRequest } from '@zro/compliance/domain';

export type CreateUserWithdrawSettingRequestGatewayRequest =
  UserWithdrawSettingRequest;

export type CreateUserWithdrawSettingRequestGatewayResponse = {
  issueId: string;
  key: string;
};

export interface UserWithdrawSettingRequestGateway {
  create(
    userWithdrawSettingRequest: CreateUserWithdrawSettingRequestGatewayRequest,
  ): Promise<CreateUserWithdrawSettingRequestGatewayResponse>;
}
