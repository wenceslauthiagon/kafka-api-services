import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Payments gateway deposits', () => {
  let env = Env();
  let headers;
  let payment_gateway;
  let token;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers('+5581944444444');
  });
  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    payment_gateway = await _cy.read_json(
      'payments_gateway_deposits',
      'payments_gateway',
    );
  });

  it('UC001 get list deposits  ', async () => {
    const response = await _cy.get_request(
      `${env.payments_gateway}/${payment_gateway[0].id}`,
      headers,
    );

    const data = [
      'id',
      'main_transaction',
      'uuid',
      'description',
      'payment_type',
      'status',
      'type_key_pix',
      'key_pix',
      'fee_value',
      'value',
      'created_at',
      'updated_at',
      'transaction_type',
      'company_id',
    ];
    for (let validations of data) {
      _cy.expect(response, validations);
    }

    const company = [
      'cnpj',
      'created_at',
      'id',
      'ie',
      'is_matrix',
      'name',
      'phone',
      'plan_id',
      'responsible_id',
      'trading_name',
      'updated_at',
      'wallet_id',
      'webhook_transaction',
      'webhook_withdraw',
    ];
    for (let validation of company) {
      _cy.expect(response, validation);
    }

    const client = ['company_id', 'document', 'email', 'id', 'name'];
    for (let validations of client) {
      _cy.expect(response, validations);
    }

    const bank = [
      'account_number',
      'agency',
      'bank_name',
      'chave_pix',
      'company_id',
      'cpf_cnpj',
      'created_at',
      'id',
      'type_chave_pix',
      'updated_at',
    ];
    for (let validatons of bank) {
      _cy.expect(response, validatons);
      console.log(response);
    }
  });
});
