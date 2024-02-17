import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Payments gateway company', () => {
  let env = Env();
  let headers;
  let token;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers('+5581944444444');
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - get my company', async () => {
    const response = await _cy.get_request(env.gateway_company, headers);
    const data = [
      'id',
      'ie',
      'name',
      'cnpj',
      'phone',
      'is_matrix',
      'trading_name',
      'plan_id',
      'responsible_id',
      'wallet_id',
      'webhook_transaction',
      'webhook_withdraw',
      'created_at',
      'updated_at',
    ];
    for (let validations of data) {
      _cy.expect(response, validations);
    }

    console.log(response);
  });
});
