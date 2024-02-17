import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Gateway Wallets', () => {
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

  it('UC001 - check a list of wallets', async () => {
    const body = {
      wallets_ids: ['374a72bc-dbb5-4ef1-acd5-6dd89aa480ba'],
    };
    const response = await _cy.post_request(env.gateway_wallets, body, headers);
    _cy.expect(response, 'success', true);
    console.log(response);
  });
});
