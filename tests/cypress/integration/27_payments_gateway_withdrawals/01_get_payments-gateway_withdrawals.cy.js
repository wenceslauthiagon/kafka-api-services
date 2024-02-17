import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Gateway Withdrawals', () => {
  let env = Env();
  let headers;
  let token;
  let file;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers('+5581944444444');
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - get list withdrawals', async () => {
    const response = await _cy.get_request(env.gateway_withdrawals, headers);
    const data = response.body.data;
    _cy.expect(data, 'id'),
      _cy.expect(data, 'main_transaction'),
      _cy.expect(data, 'uuid'),
      _cy.expect(data, 'description'),
      _cy.expect(data, 'payment_type'),
      _cy.expect(data, 'status'),
      _cy.expect(data, 'type_key_pix'),
      _cy.expect(data, 'key_pix'),
      _cy.expect(data, 'fee_value'),
      _cy.expect(data, 'value'),
      _cy.expect(data, 'created_at'),
      _cy.expect(data, 'updated_at'),
      _cy.expect(data, 'transaction_type'),
      _cy.expect(data, 'company_id');

    const process_status = [
      'process_status',
      'company_id',
      'document',
      'email',
      'id',
      'name',
    ];
    for (let validations of process_status) {
      _cy.expect(response, validations);
    }

    const banks = response.body.data.data;
    _cy.expect(banks, 'id'),
      _cy.expect(banks, 'agency'),
      _cy.expect(banks, 'cpf_cnpj'),
      _cy.expect(banks, 'chave_pix'),
      _cy.expect(banks, 'company_id'),
      _cy.expect(banks, 'account_number'),
      _cy.expect(banks, 'type_chave_pix'),
      _cy.expect(banks, 'bank_name'),
      _cy.expect(banks, 'created_at'),
      _cy.expect(banks, 'updated_at');

    const company = response.body.data.data;
    _cy.expect(company, 'id'),
      _cy.expect(company, 'ie'),
      _cy.expect(company, 'name'),
      _cy.expect(company, 'cnpj'),
      _cy.expect(company, 'phone'),
      _cy.expect(company, 'is_matrix'),
      _cy.expect(company, 'trading_name'),
      _cy.expect(company, 'plan_id'),
      _cy.expect(company, 'responsible_id'),
      _cy.expect(company, 'wallet_id'),
      _cy.expect(company, 'webhook_transaction'),
      _cy.expect(company, 'webhook_withdraw'),
      _cy.expect(company, 'created_at'),
      _cy.expect(company, 'updated_at');

    const links = ['first', 'last'];
    for (let validations of links) {
      _cy.expect(response, validations);
    }

    const path = response.body.data.meta;
    _cy.expect(path, 'path');

    console.log(response);

    file = response.body.data.data;
  });

  it('create json file', async () => {
    await _cy.write_json('payments_gateway_withdrawals', 'withdrawals', file);
  });
});
