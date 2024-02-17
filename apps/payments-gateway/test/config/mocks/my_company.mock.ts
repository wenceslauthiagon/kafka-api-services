import { faker } from '@faker-js/faker/locale/pt_BR';

export const success = () => {
  const data = {
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
    branches: [
      {
        id: 19,
        ie: '123123123',
        name: 'BASTOS FOODS COMERCIO DE ALIMENTOS LTDA',
        cnpj: '44357347000161',
        phone: '8199999923',
        is_matrix: false,
        trading_name: 'AMERCICAN COOKIE',
        plan_id: 4,
        responsible_id: 22,
        wallet_id: '492fee00-fe42-444c-a2dc-39e2033360fa',
        webhook_transaction: null,
        webhook_withdraw: null,
        created_at: '2023-02-08T19:53:53+00:00',
        updated_at: '2023-02-08T19:54:10+00:00',
      },
      {
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
    ],
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
