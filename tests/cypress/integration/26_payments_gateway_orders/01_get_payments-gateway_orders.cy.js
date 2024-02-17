import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Gateway Orders', () => {
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

  it('UC001 - List orders', async () => {
    const response = await _cy.get_request(env.gateway_order, headers);

    //the order endpoint in the database receives data as null but if there is data, uncomment the following code

    // for (let item of response.body.data.data) {
    //   _cy.expect(item, 'id'),
    //     _cy.expect(item, 'value'),
    //     _cy.expect(item, 'fee'),
    //     _cy.expect(item, 'fee_in_percent'),
    //     _cy.expect(item, 'company_id'),
    //     _cy.expect(item, 'transaction_id'),
    //     _cy.expect(item, 'total_value_shopkeeper_cents'),
    //     _cy.expect(item, 'payment_status'),
    //     _cy.expect(item, 'created_at'),
    //     _cy.expect(item, 'updated_at');
    // }

    // for (let links of response.body.data.links) {
    //   _cy.expect(links, 'first'),
    //     _cy.expect(links, 'last'),
    //     _cy.expect(links, 'next');
    // }

    // for (let meta of response.body.data.meta.links) {
    //   _cy.expect(meta, 'url'),
    //     _cy.expect(meta, 'label'),
    //     _cy.expect(meta, 'active');
    // }

    const links = response.body.data.links;
    _cy.expect(links, 'first'), _cy.expect(links, 'last');

    _cy.expect(response, 'path');

    file = response.body.data;
  });

  it('create json file', async () => {
    await _cy.write_json('gateway_orders', 'orders', file);
  });
});
