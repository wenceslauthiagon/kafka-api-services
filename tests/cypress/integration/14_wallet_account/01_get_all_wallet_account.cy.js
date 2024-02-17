import { Env, Support as _cy } from '../../support/support';

describe('TC051 - Test api  Operations wallet account', () => {
  let env = Env();
  let headers;
  let token;
  let file;
  _cy._time(60000);

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - get list operations wallet account', async () => {
    const response = await _cy.get_request(
      `${env.wallet_account}?page=1&size=20&order=asc`,
      headers,
    );
    const array = response.body.data.data;
    for (let validation of array) {
      _cy.expect(validation, 'id');
      _cy.expect(validation, 'balance');
      _cy.expect(validation, 'pending_amount');
      _cy.expect(validation, 'average_price');
      _cy.expect(validation, 'currency_id');
      _cy.expect(validation, 'currency_title');
      _cy.expect(validation, 'currency_symbol');
      _cy.expect(validation, 'currency_symbol_align');
    }
    file = response.body.data.data;
  });
  it('create json file', async () => {
    await _cy.write_json('wallet_account', 'wallet_account_list', file);
  });

  it('UC002 - get list operations wallet account currency symbol', async () => {
    for (let currency_symbol of file) {
      const response = await _cy.get_request(
        `${env.wallet_account}?page=1&size=20&order=asc&currency_symbol=${currency_symbol.currency_symbol}`,
        headers,
      );
      _cy.expect(response, 'currency_symbol', currency_symbol.currency_symbol);
      cy.wait(3000);
    }
  });
});
