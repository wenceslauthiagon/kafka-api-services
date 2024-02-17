import { ResultType } from '@zro/api-jdpi/domain';
import { JdpiErrorCode } from '@zro/jdpi/domain';

export interface VerifyNotifyCreditPixStatementPspRequest {
  id: string;
  groupId: string;
  endToEndId: string;
  resultType: ResultType;
  devolutionCode?: JdpiErrorCode;
  description?: string;
  createdAt: Date;
}

export interface VerifyNotifyCreditPixStatementPspResponse {
  endToEndId: string;
  createdAt: Date;
}

export interface VerifyNotifyCreditPixStatementPspGateway {
  verifyNotifyCreditPixStatement(
    request: VerifyNotifyCreditPixStatementPspRequest,
  ): Promise<VerifyNotifyCreditPixStatementPspResponse>;
}
