import { OperationType } from '@zro/reports/domain';
import { PersonDocumentType } from '@zro/users/domain';

export interface GetTransactionStatementRequest {
  page: number;
  limit: number;
  created_start_date: string;
  created_end_date: string;
}

export interface GetTransactionStatementResponse {
  data: {
    operation_id: string;
    operation_date: string;
    operation_value: number;
    operation_type: OperationType;
    transaction_type_tag: string;
    third_part_name: string;
    third_part_document: string;
    third_part_type_document: PersonDocumentType;
    client_name: string;
    client_document: string;
    client_type_document: PersonDocumentType;
    client_bank_code: string;
    client_branch: string;
    client_account_number: string;
    currency_symbol: string;
  }[];
}
