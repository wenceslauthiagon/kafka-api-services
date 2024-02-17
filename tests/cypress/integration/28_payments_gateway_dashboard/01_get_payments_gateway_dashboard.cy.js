import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Gateway Dashboard', () => {
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

  it('UC001 - get list dashboard', async () => {
    const response = await _cy.get_request(env.gateway_dashboard, headers);
    for (let item of response.body.data.data) {
      _cy.expect(item, 'type'),
        _cy.expect(item, 'status'),
        _cy.expect(item, 'total_items'),
        _cy.expect(item, 'total_value');
    }
  });
});
