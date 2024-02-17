import { Env, Support as _cy } from '../../support/support';

describe('TC060 - test api quatations conversions', () => {
  let env = Env();
  let headers;
  let token;
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  it('UC001 - get quotation trends by base currency', async () => {
    const response = await _cy.get_request(env.quatations_trands, headers);
    _cy.expect(response, 'quote_currency_symbol');
    _cy.expect(response, 'quote_currency_decimal');
    _cy.expect(response, 'quote_currency_title');
    _cy.expect(response, 'base_currency_symbol');
    _cy.expect(response, 'base_currency_decimal');
    _cy.expect(response, 'base_currency_title');
    for (let response_ of response.body.data) {
      const points_ = response_.points;
      _cy.expect(points_, 'price');
      _cy.expect(points_, 'price_buy');
      _cy.expect(points_, 'price_sell');
      _cy.expect(points_, 'timestamp');
    }
  });
});
