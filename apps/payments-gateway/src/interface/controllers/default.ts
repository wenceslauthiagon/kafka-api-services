import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
  IsPositive,
  IsInt,
} from 'class-validator';
import {
  AutoValidator,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
} from '@zro/common';
import { Wallet } from '@zro/operations/domain';
import { IsCnpj } from '@zro/common/decorators/validate_is_cnpj.decorator';

export type WalletId = Wallet['uuid'];

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export type TFiltersRequest = {
  wallet_id?: WalletId;
  limit?: string;
  page?: string;
  id?: string;
  order?: Order;
  field?: string;
  client_name?: string;
  client_document?: string;
  client_email?: string;
  bank_reference?: string;
  instant_payment_id?: string;
  type_key_pix?: string;
  key_pix?: string;
  created_start_date?: string;
  created_end_date?: string;
  updated_start_date?: string;
  updated_end_date?: string;
  status?: string;
  company_id?: string;
  bank_name?: string;
  transaction_type?: string;
  end_to_end_id_field?: string;
  merchant_id?: string;
};

export class FiltersRequest extends AutoValidator implements TFiltersRequest {
  @IsOptional()
  @IsUUID()
  wallet_id?: WalletId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  limit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  page?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  id?: string;

  @IsOptional()
  @IsEnum(Order)
  order?: Order;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  field?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_document?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  bank_reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  instant_payment_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  type_key_pix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  key_pix?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'Invalid format date created start date',
  })
  @IsDateBeforeThan('created_end_date', true, {
    message: 'Created start date must be before than created end date',
  })
  created_start_date?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'Invalid format date created end date',
  })
  @IsDateAfterThan('created_start_date', true, {
    message: 'Created end date must be after than created start date',
  })
  created_end_date?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'Invalid format date updated start date',
  })
  @IsDateBeforeThan('updated_end_date', true, {
    message: 'Updated start date must be before than updated end date',
  })
  updated_start_date?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'Invalid format date updated end date',
  })
  @IsDateAfterThan('updated_start_date', true, {
    message: 'Updated end date must be after than updated start date',
  })
  updated_end_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  company_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  bank_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  transaction_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  end_to_end?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  merchant_id?: string;

  constructor(props: TFiltersRequest) {
    super(props);
  }
}

export type TClient = {
  id?: number;
  name?: string;
  email?: string;
  document?: string;
  blacklist?: boolean;
  company_id?: number;
};

export class Client extends AutoValidator implements TClient {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  document?: string;

  @IsOptional()
  @IsBoolean()
  blacklist?: boolean;

  @IsOptional()
  @IsNumber()
  company_id?: number;

  constructor(props: TClient) {
    super(props);
  }
}

export type TErrorDescription = {
  description?: string;
};

export type TBank = {
  id?: number;
  agency?: string;
  cpf_cnpj?: string;
  x_api_key?: string;
  chave_pix?: string;
  company_id?: number;
  account_number?: string;
  type_chave_pix?: string;
  owner_account_name?: string;
  bank_name?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  max_withdraw_daily?: string;
  max_withdraw_value_daily_cents?: string;
  max_withdraw_value_monthly_cents?: string;
  active_for_cash_in?: boolean;
  active_for_cash_out?: boolean;
};

export type TPaidByClient = {
  id?: number;
  name?: string;
  email?: string;
  document?: string;
  company_id?: number;
};

export type TCompany = {
  id?: number;
  ie?: string;
  name?: string;
  cnpj?: string;
  phone?: string;
  is_matrix?: boolean;
  trading_name?: string;
  plan_id?: number;
  responsible_id?: number;
  wallet_id?: string;
  webhook_transaction?: string;
  webhook_withdraw?: string;
  created_at?: string;
  updated_at?: string;
};

export type TKyc = {
  of_legal_age?: boolean;
  birthdate?: string;
  suspected_death?: boolean;
  pep?: string;
  age?: number;
};

export type TLink = {
  url?: string;
  label?: string;
  active?: boolean;
};

export type TLinks = {
  first?: string;
  last?: string;
  prev?: string;
  next?: string;
};

export type TMeta = {
  current_page?: number;
  from?: number;
  last_page?: number;
  links?: TLink[];
  path?: string;
  per_page?: number;
  to?: number;
  total?: number;
};

export class ErrorDescription
  extends AutoValidator
  implements TErrorDescription
{
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  constructor(props: TErrorDescription) {
    super(props);
  }
}

export class PaidByClient extends AutoValidator implements TPaidByClient {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  document?: string;

  @IsOptional()
  @IsNumber()
  company_id?: number;

  constructor(props: TPaidByClient) {
    super(props);
  }
}
export class Bank extends AutoValidator implements TBank {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  agency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  cpf_cnpj?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  x_api_key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  chave_pix?: string;

  @IsOptional()
  @IsOptional()
  @IsNumber()
  company_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  account_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  type_chave_pix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  owner_account_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  bank_name?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ')
  created_at?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ')
  updated_at?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH?:mm?:ssZ')
  deleted_at?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  max_withdraw_daily?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  max_withdraw_value_daily_cents?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  max_withdraw_value_monthly_cents?: string;

  @IsOptional()
  @IsBoolean()
  active_for_cash_in?: boolean;

  @IsOptional()
  @IsBoolean()
  active_for_cash_out?: boolean;

  constructor(props: TBank) {
    super(props);
  }
}

export class Company extends AutoValidator implements TCompany {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ie?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsCnpj()
  cnpj?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  is_matrix?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  trading_name?: string;

  @IsOptional()
  @IsNumber()
  plan_id?: number;

  @IsOptional()
  @IsNumber()
  responsible_id?: number;

  @IsOptional()
  @IsUUID(4)
  wallet_id?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  webhook_transaction?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  webhook_withdraw?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ')
  created_at?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ')
  updated_at?: string;

  constructor(props: TCompany) {
    super(props);
  }
}

export class Kyc extends AutoValidator implements TKyc {
  @IsOptional()
  @IsBoolean()
  of_legal_age?: boolean;

  @IsOptional()
  @IsString()
  birthdate?: string;

  @IsOptional()
  @IsBoolean()
  suspected_death?: boolean;

  @IsOptional()
  @IsString()
  pep?: string;

  @IsOptional()
  @IsInt()
  age?: number;

  constructor(props: TKyc) {
    super(props);
  }
}

export type TTransactionResponseItem = {
  id?: number;
  process_status?: string;
  reference?: string;
  main_transaction?: string;
  uuid?: string;
  description?: string;
  payment_type?: string;
  status?: string;
  type_key_pix?: string;
  key_pix?: string;
  fee_value?: string;
  value?: string;
  created_at?: string;
  updated_at?: string;
  transaction_type?: string;
  end_to_end_id_field?: string;
  psp_bank_name?: string;
  psp_ispb?: string;
  company_id?: number;
  instant_payment_id_field?: string;
  error_description?: TErrorDescription;
  client?: TClient;
  bank?: TBank;
  paid_by_client?: TPaidByClient;
  company?: TCompany;
  kyc?: TKyc;
};

export class TransactionResponseItem
  extends AutoValidator
  implements TTransactionResponseItem
{
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  process_status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  main_transaction?: string;

  @IsOptional()
  @IsUUID(4)
  uuid?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  payment_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  type_key_pix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  key_pix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fee_value?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  value?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ')
  created_at?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ')
  updated_at?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  transaction_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  end_to_end_id_field?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  psp_bank_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  psp_ispb?: string;

  @IsOptional()
  @IsNumber()
  company_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  instant_payment_id_field?: string;

  @IsOptional()
  @IsObject()
  error_description?: TErrorDescription;

  @IsOptional()
  @IsObject()
  client?: TClient;

  @IsOptional()
  @IsObject()
  bank?: TBank;

  @IsOptional()
  @IsObject()
  paid_by_client?: TPaidByClient;

  @IsOptional()
  @IsObject()
  company?: TCompany;

  @IsOptional()
  @IsObject()
  kyc?: Kyc;

  constructor(props: TTransactionResponseItem) {
    super(props);
    this.kyc = new Kyc(props.kyc);
    this.error_description = new ErrorDescription(props.error_description);
    this.bank = new Bank(props.bank);
    this.company = new Company(props.company);
    this.client = new Client(props.client);
  }
}

export type TTransaction = {
  id?: number;
  process_status?: string;
  reference?: string;
  main_transaction?: string;
  uuid?: string;
  description?: string;
  payment_type?: string;
  status?: string;
  type_key_pix?: string;
  key_pix?: string;
  fee_value?: string;
  value?: string;
  created_at?: string;
  updated_at?: string;
  transaction_type?: string;
  end_to_end_id_field?: string;
  psp_bank_name?: string;
  psp_ispb?: string;
  company_id?: number;
  instant_payment_id_field?: string;
  error_description?: TErrorDescription;
  kyc?: TKyc;
};

export class Transaction extends AutoValidator implements TTransaction {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  process_status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  main_transaction?: string;

  @IsOptional()
  @IsUUID(4)
  uuid?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsString()
  @MaxLength(255)
  payment_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  type_key_pix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  key_pix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fee_value?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  value?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ')
  created_at?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ')
  updated_at?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  transaction_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  end_to_end_id_field?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  psp_bank_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  psp_ispb?: string;

  @IsOptional()
  @IsNumber()
  company_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  instant_payment_id_field?: string;

  @IsOptional()
  @IsObject()
  error_description?: TErrorDescription;

  @IsOptional()
  @IsObject()
  kyc?: Kyc;

  constructor(props: TTransaction) {
    super(props);
    this.error_description = new ErrorDescription(props.error_description);
  }
}

type TGetTransactionByIdRequest = {
  wallet_id: WalletId;
  id: number;
};

export class GetTransactionByIdRequest
  extends AutoValidator
  implements TGetTransactionByIdRequest
{
  @IsUUID()
  wallet_id: WalletId;

  @IsPositive()
  id: number;

  constructor(props: TGetTransactionByIdRequest) {
    super(props);
  }
}
