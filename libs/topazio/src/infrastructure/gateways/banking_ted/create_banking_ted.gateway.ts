import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  BankingTedGateway,
  BankingTedPspException,
  CreateBankingTedPspRequest,
  CreateBankingTedPspResponse,
  OfflineBankingTedPspException,
} from '@zro/banking/application';
import {
  TopazioAuthGateway,
  Sanitize,
  TOPAZIO_SERVICES,
} from '@zro/topazio/infrastructure';

interface SenderBankingTed {
  document: string;
  name: string;
  accountNumber: string;
}

interface RecipientBankingTed {
  document: string;
  name: string;
  bankCode: string;
  branch: string;
  accountNumber: string;
  accountType: string;
}

interface OperationBankingTed {
  value: number;
  purposeCode: string;
  note: string;
}

interface TopazioCreateBankingTedRequest {
  sender: SenderBankingTed;
  recipient: RecipientBankingTed;
  operation: OperationBankingTed;
  callbackUrl: string;
}

export class TopazioCreateBankingTedPspGateway
  implements Pick<BankingTedGateway, 'createBankingTed'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: TopazioCreateBankingTedPspGateway.name,
    });
  }

  async createBankingTed(
    request: CreateBankingTedPspRequest,
  ): Promise<CreateBankingTedPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    try {
      const payload: TopazioCreateBankingTedRequest = {
        sender: {
          document: Sanitize.document(request.ownerDocument),
          name: Sanitize.fullName(request.ownerName),
          accountNumber: Sanitize.accountNumber(request.ownerAccount),
        },
        recipient: {
          document: Sanitize.document(request.beneficiaryDocument),
          name: Sanitize.fullName(request.beneficiaryName),
          bankCode: Sanitize.bankCode(request.beneficiaryBankCode),
          branch: Sanitize.branch(request.beneficiaryAgency),
          accountNumber: Sanitize.accountNumber(
            `${request.beneficiaryAccount}${request.beneficiaryAccountDigit}`,
          ),
          accountType: request.beneficiaryAccountType.toUpperCase(),
        },
        operation: {
          value: Sanitize.toValue(request.amount),
          purposeCode: request.purposeCode?.toString(),
          ...(request.description && {
            note: Sanitize.description(request.description),
          }),
        },
        callbackUrl: request.callbackUrl,
      };

      const headers = {
        access_token: await TopazioAuthGateway.getAccessToken(this.logger),
        transaction_id: request.transactionId,
      };

      this.logger.info('Request payload.', { payload });

      const response = await this.axios.post<void>(
        TOPAZIO_SERVICES.BANKING_TED.CREATE,
        payload,
        { headers },
      );

      this.logger.info('Response found.', { data: response.data });

      return {
        transactionId: request.transactionId,
      };
    } catch (error) {
      this.logger.error('ERROR Topazio request.', {
        error: error.isAxiosError ? error.message : error,
      });

      const parseMessage = (message: string) => {
        if (!message) return;

        if (message.startsWith('An error occurred while sending the request')) {
          throw new OfflineBankingTedPspException(error);
        } else if (message.startsWith('No such host is known')) {
          throw new OfflineBankingTedPspException(error);
        }
      };

      if (error.response?.data) {
        this.logger.error('ERROR Topazio response data.', {
          error: error.response.data,
        });

        const { type, message, errors } = error.response.data;
        switch (type) {
          case 'ValidationError':
            const messages = Array.isArray(errors)
              ? errors.map((e) => e.message)
              : [message];

            messages.forEach(parseMessage);
            break;
          default: // AuthorizationError, NotFoundError, InternalServerError
        }
      }

      this.logger.error('Unexpected Topazio gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new BankingTedPspException(error);
    }
  }
}
