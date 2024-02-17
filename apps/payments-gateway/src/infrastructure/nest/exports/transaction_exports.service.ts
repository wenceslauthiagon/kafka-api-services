import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  OfflineTransactionExportsException,
  PAYMENTS_GATEWAY_SERVICES,
  TransactionExportsException,
} from '@zro/payments-gateway/application';
import { buildQueryStringFilter } from '@zro/common';
import { TransactionExportsRequest } from '@zro/payments-gateway/interface';

export class TransactionExportsServiceRest {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: TransactionExportsServiceRest.name });
  }

  /**
   * Call transaction exports microservice to get a file.
   * @param payload Data.
   */
  async execute(
    payload: TransactionExportsRequest,
    instanceAxios: AxiosInstance,
  ): Promise<any> {
    const logger = this.logger.child({ loggerId: this.requestId });

    const {
      wallet_id,
      id,
      uuid,
      client_name,
      client_document,
      client_email,
      type_key_pix,
      key_pix,
      created_start_date,
      created_end_date,
      updated_start_date,
      updated_end_date,
      status,
      company_id,
      bank_name,
      transaction_type,
      end_to_end,
    } = payload;

    const downloadUrl = buildQueryStringFilter(
      PAYMENTS_GATEWAY_SERVICES.EXPORT,
      {
        ...(id && { id }),
        ...(uuid && { uuid }),
        ...(client_name && { client_name }),
        ...(client_document && { client_document }),
        ...(client_email && { client_email }),
        ...(type_key_pix && { type_key_pix }),
        ...(key_pix && { key_pix }),
        ...(created_start_date && { created_start_date }),
        ...(created_end_date && { created_end_date }),
        ...(updated_start_date && { updated_start_date }),
        ...(updated_end_date && { updated_end_date }),
        ...(status && { status }),
        ...(company_id && { company_id }),
        ...(bank_name && { bank_name }),
        ...(transaction_type && { transaction_type }),
        ...(end_to_end && { end_to_end }),
      },
    );

    logger.debug('Download transaction exports file.', { payload });

    try {
      const response = await instanceAxios.get(downloadUrl, {
        responseType: 'blob',
        headers: {
          'WALLET-ID': wallet_id,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error('ERROR Transaction exports request.', {
        error: error.isAxiosError ? error.message : error,
      });

      if (error.isAxiosError) {
        throw new OfflineTransactionExportsException(error);
      }

      throw new TransactionExportsException(error.response?.data);
    }
  }
}
