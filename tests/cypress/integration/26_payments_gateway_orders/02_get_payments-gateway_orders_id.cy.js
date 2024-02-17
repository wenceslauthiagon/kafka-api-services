import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Gateway Orders', () => {
  let env = Env();
  let headers;
  let token;
  let orders;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers('+5581944444444');
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  before(async () => {
    orders = await _cy.read_json('gateway_orders', 'orders');
  });

  it('UC001 - List orders', async () => {
    const response = await _cy.get_request(
      `${env.gateway_order}/${orders}`,
      headers,
    );

    const links = response.body.data.links;
    _cy.expect(links, 'first'), _cy.expect(links, 'last');

    file = response.body.data;
  });

  it('create json file', async () => {
    await _cy.write_json('gateway_orders', 'orders', file);
  });
});
