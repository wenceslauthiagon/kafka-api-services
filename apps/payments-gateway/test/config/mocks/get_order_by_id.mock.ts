import { faker } from '@faker-js/faker/locale/pt_BR';

export const success = () => {
  const data = {
    id: 1,
    value_cents: 30000,
    fee_in_percent: '10',
    company_id: 18,
    transaction_id: 24629,
    total_value_shopkeeper_cents: 26700,
    payment_status: 'pending',
    created_at: '2023-02-10T20:18:26+00:00',
    updated_at: '2023-02-10T20:18:26+00:00',
    company: {
      id: 18,
      ie: '123123123',
      name: 'CASA UTILIDADES EIRELI EPP',
      cnpj: '15545443000135',
      phone: '8199999999',
      is_matrix: false,
      trading_name: 'MULTICOISA',
      plan_id: 4,
      responsible_id: 22,
      wallet_id: '095d0e87-08f9-4356-ab54-2405bb8c18c0',
      webhook_transaction: null,
      webhook_withdraw: null,
      created_at: '2023-02-08T19:53:09+00:00',
      updated_at: '2023-02-08T19:54:23+00:00',
    },
    transaction: {
      id: 24629,
      reference: null,
      main_transaction: 'f115cec4-5fc8-4929-8fe8-84587d2bd3fa',
      uuid: 'f115cec4-5fc8-4929-8fe8-84587d2bd3fa',
      description: 'Qr code Zro Gateway',
      payment_type: 'pix',
      status: 'pending',
      type_key_pix: 'evp',
      key_pix: 'e0904f74-988a-4c4c-831d-34e4eece7d91',
      fee_value: '0,00',
      value: '300,00',
      created_at: '2023-02-10T20:18:26+00:00',
      updated_at: '2023-02-10T20:18:26+00:00',
      transaction_type: 'transaction',
      end_to_end_id_field: null,
      psp_bank_name: null,
      psp_ispb: null,
      company_id: 17,
      instant_payment_id_field: null,
      error_description: {
        description: null,
      },
      kyc: {
        of_legal_age: true,
        birthdate: 'test',
        suspected_death: false,
        pep: 'test',
        age: 35,
      },
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
