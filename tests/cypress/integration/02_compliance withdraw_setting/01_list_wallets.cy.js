import { Env, Support as _cy } from '../../support/support';

describe('TC004 - Test - API operations Wallets - List wallet', () => {
  let env = Env();
  let headers;
  let token;
  let id_wallet;

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  _cy._time(60000);

  it('UC001 - Get a list of user wallets', async () => {
    const response = await _cy.get_request(env.operation_list_wallet, headers);
    _cy.expect(response, 'data');
    id_wallet = _cy.findInJson(response, 'id');
  });

  it('UC002 - create JSON id wallet', async () => {
    await cy.writeFile('../tests/cypress/fixtures/compliance/id_wallets.json', {
      id: id_wallet,
    });
  });
});
