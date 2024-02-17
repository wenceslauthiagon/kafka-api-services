import { faker } from '@faker-js/faker/locale/pt_BR';

export const success = () => {
  const data = {
    data: [
      {
        id: 24707,
        reference: 'e8746498-8803-4d4c-87f0-45ca70f9360d',
        main_transaction: '4c55166e420f48a3a6ff3008f48cac73',
        uuid: 'c200c6a4-f288-41c3-872e-c36fba4ea900',
        description: 'PIX',
        payment_type: 'pix',
        status: 'pending',
        type_key_pix: 'evp',
        key_pix: 'e3db9fda-3c96-48dc-811b-8dc7d74aa201',
        fee_value: '0,25',
        value: '17,34',
        created_at: '2023-02-15T19:00:17+00:00',
        updated_at: '2023-02-15T19:00:20+00:00',
        transaction_type: 'returned',
        end_to_end_id_field: null,
        psp_bank_name: null,
        psp_ispb: null,
        company_id: 17,
        instant_payment_id_field: null,
        error_description: {
          description: null,
        },
        client: {
          id: 4737,
          name: 'iasrUuo',
          email: null,
          document: '96707',
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
          webhook_transaction:
            'https://paurus.ngrok.io/servlet/zrobank/callback',
          webhook_withdraw: 'https://paurus.ngrok.io/servlet/zrobank/callback',
          created_at: '2023-02-08T18:23:03+00:00',
          updated_at: '2023-02-08T19:54:46+00:00',
        },
      },
      {
        id: 24706,
        reference: 'cba6daa3-cda5-4aa9-811f-67ea4a57318c',
        main_transaction: '6c6dd7b7e9df4ed5885cadd81d0e4510',
        uuid: 'f0840de4-41a8-4c24-8111-e74c0b4776fb',
        description: 'PIX',
        payment_type: 'pix',
        status: 'pending',
        type_key_pix: 'evp',
        key_pix: 'e3db9fda-3c96-48dc-811b-8dc7d74aa201',
        fee_value: '0,25',
        value: '17,34',
        created_at: '2023-02-15T18:56:23+00:00',
        updated_at: '2023-02-15T18:56:26+00:00',
        transaction_type: 'returned',
        end_to_end_id_field: null,
        psp_bank_name: null,
        psp_ispb: null,
        company_id: 17,
        instant_payment_id_field: null,
        error_description: {
          description: null,
        },
        client: {
          id: 4737,
          name: 'iasrUuo',
          email: null,
          document: '96707',
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
          webhook_transaction:
            'https://paurus.ngrok.io/servlet/zrobank/callback',
          webhook_withdraw: 'https://paurus.ngrok.io/servlet/zrobank/callback',
          created_at: '2023-02-08T18:23:03+00:00',
          updated_at: '2023-02-08T19:54:46+00:00',
        },
      },
    ],
    links: {
      first: 'http://zro-api-admin.lets.com.vc/api/transactions/returns?page=1',
      last: 'http://zro-api-admin.lets.com.vc/api/transactions/returns?page=1',
      prev: null,
      next: null,
    },
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      links: [
        {
          url: null,
          label: '&laquo; Previous',
          active: false,
        },
        {
          url: 'http://zro-api-admin.lets.com.vc/api/transactions/returns?page=1',
          label: '1',
          active: true,
        },
        {
          url: null,
          label: 'Next &raquo;',
          active: false,
        },
      ],
      path: 'http://zro-api-admin.lets.com.vc/api/transactions/returns',
      per_page: 15,
      to: 2,
      total: 2,
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
