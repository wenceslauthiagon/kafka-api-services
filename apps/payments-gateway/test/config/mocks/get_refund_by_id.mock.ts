import { faker } from '@faker-js/faker/locale/pt_BR';

export const success = () => {
  const data = {
    id: 24713,
    reference: '18b871cf-2d89-49b9-84d6-b988e24e0be8',
    main_transaction: 'c02207a822734c88b61a375df453a13b',
    uuid: '14e81674-1646-4da4-b4b9-dcd656246f4a',
    description: 'PIX',
    payment_type: 'pix',
    status: 'pending',
    type_key_pix: 'evp',
    key_pix: 'e3db9fda-3c96-48dc-811b-8dc7d74aa201',
    fee_value: '0,25',
    value: '103,30',
    created_at: '2023-02-16T17:37:00+00:00',
    updated_at: '2023-02-16T17:37:04+00:00',
    transaction_type: 'refund',
    end_to_end_id_field: null,
    psp_bank_name: null,
    psp_ispb: null,
    company_id: 17,
    instant_payment_id_field: null,
    error_description: {
      description: null,
    },
    client: {
      id: 4739,
      name: 'isouUra',
      email: null,
      document: '96739',
      blacklist: null,
      company_id: 17,
    },
    bank: {
      id: 12,
      agency: '1',
      cpf_cnpj: '08715757001579',
      x_api_key: null,
      chave_pix: 'e3db9fda-3c96-48dc-811b-8dc7d74aa201',
      company_id: null,
      account_number: '33338888',
      type_chave_pix: 'evp',
      owner_account_name: 'ZRO (JCPM/RIOMAR)',
      bank_name: 'Zro Bank',
      created_at: '2023-02-09T19:53:05+00:00',
      updated_at: '2023-02-09T19:53:05+00:00',
      deleted_at: null,
      max_withdraw_daily: null,
      max_withdraw_value_daily_cents: null,
      max_withdraw_value_monthly_cents: null,
      active_for_cash_in: null,
      active_for_cash_out: null,
    },
    company: {
      id: 17,
      ie: '123123123',
      name: 'NE SERVIÇOS DE INTERMEDIAÇÃO DIGITAL LTDA',
      cnpj: '23625574000150',
      phone: '81999999999',
      is_matrix: true,
      trading_name: 'RIOMAR RECIFE',
      plan_id: 4,
      responsible_id: 22,
      wallet_id: '374a72bc-dbb5-4ef1-acd5-6dd89aa480ba',
      webhook_transaction: 'https://paurus.ngrok.io/servlet/zrobank/callback',
      webhook_withdraw: 'https://paurus.ngrok.io/servlet/zrobank/callback',
      created_at: '2023-02-08T18:23:03+00:00',
      updated_at: '2023-02-08T19:54:46+00:00',
    },
  };

  return Promise.resolve({ status: 200, data });
};

export const offline = () => {
  const error = {
    message: 'Offline',
    response: {
      data: { code: -faker.datatype.number(), msg: 'Error message.' },
    },
  };

  return Promise.reject(error);
};

export const unauthorized = () => {
  const error = {
    isAxiosError: true,
    message: 'Unauthorized',
    response: {
      status: 403,
      data: { code: 403, msg: 'Not authorized. Header WALLET-ID Invalid!.' },
    },
  };

  return Promise.reject(error);
};
