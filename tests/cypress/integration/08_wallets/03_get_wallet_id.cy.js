import { Env, Support as _cy } from '../../support/support';

describe('TC041 - Test api  Wallets', () => {
  let env = Env();
  let headers;

  let wallet;
  let token;
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

  it('UC001 - get list all wallets', async () => {
    const response = await _cy.get_request(
      `${env.wallets}/${wallet.id}`,
      headers,
    );
    const arra_list = [
      'id',
      'name',
      'state',
      'permission_types',
      'owner_id',
      'owner_name',
      'created_at',
    ];
    for (let validation of arra_list) {
      _cy.expect(response, validation);
    }
  });
});
