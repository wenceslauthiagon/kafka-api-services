import { Env, Support as _cy } from '../../support/support';

describe('TC059 - test api quatations conversions', () => {
  let env = Env();
  let headers;
  let token;
  let id_get;
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  _cy._time(10000);
  it('UC001 - To create a new currency conversion', async () => {
    const response = await _cy.get_request(env.quotations_conversions, headers);
    const array = [
      'base_amount_buy',
      'base_amount_sell',
      'base_currency_decimal',
      'base_currency_symbol',
      'base_currency_title',
      'id',
      'iof_amount',
      'iof_bps',
      'partial_buy',
      'partial_sell',
      'price',
      'price_buy',
      'price_sell',
      'quote_amount_buy',
      'quote_amount_sell',
      'quote_currency_decimal',
      'quote_currency_symbol',
      'quote_currency_title',
      'side',
      'spread_buy',
      'spread_buy_bps',
      'spread_sell',
      'spread_sell_bps',
    ];
    for (let validate of array) {
      _cy.expect(response, validate);
    }
    id_get = _cy.findInJson(response, 'id');
  });
  it('create JSON id', async () => {
    _cy.write_json('quotations', 'get_new_spot', { id: id_get });
  });
});
