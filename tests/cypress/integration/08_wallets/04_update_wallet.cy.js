import { Env, Support as _cy } from '../../support/support';

describe('TC042 - Test api  Wallets', () => {
  let env = Env();
  let headers;
  let token;
  let wallet;
  let file;
  _cy._time(60000);

  before(async () => {
    token = await _cy.headers();
  });
  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  before(async () => {
    wallet = await _cy.read_json('wallets', 'create_wallet');
  });

  it('UC001 - create a new wallet', async () => {
    const update_wallet = `update testing - ${_cy.generateString(5)}`;
    const response = await _cy.put_request(
      `${env.wallets}/${wallet.id}`,
      { name: update_wallet },
      headers,
    );
    _cy.expect(response, 'id');
    _cy.expect(response, 'name', update_wallet);
    _cy.expect(response, 'state');

    file = response.body.data;
  });
  it('create json file', async () => {
    await _cy.write_json('wallets', 'update_wallet', file);
  });
});
