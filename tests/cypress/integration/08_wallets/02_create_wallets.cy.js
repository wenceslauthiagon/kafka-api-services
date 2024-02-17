import { Env, Support as _cy } from '../../support/support';

describe('TC039 - Test api  Wallets', () => {
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

  it('UC001 - create a new wallet', async () => {
    const response = await _cy.post_request(
      env.wallets,
      { name: ` create testing - ${_cy.generateString(5)}` },
      headers,
    );
    _cy.expect(response, 'id');
    _cy.expect(response, 'name');
    _cy.expect(response, 'state');

    file = response.body.data;
  });
  it('create json file', async () => {
    await _cy.write_json('wallets', 'create_wallet', file);
  });
  it('UC001 - create a new wallet for P2P Transfers in Operation', async () => {
    const response = await _cy.post_request(
      env.wallets,
      { name: ` create testing - ${_cy.generateString(5)}` },
      headers,
    );
    _cy.expect(response, 'id');
    _cy.expect(response, 'name');
    _cy.expect(response, 'state');

    file = response.body.data;
  });
  it('create json file', async () => {
    await _cy.write_json(
      'p2p_operations',
      'create_wallet_for_operations',
      file,
    );
  });
});
