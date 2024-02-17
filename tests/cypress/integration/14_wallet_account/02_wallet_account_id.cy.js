import { Env, Support as _cy } from '../../support/support';

describe('TC052 - Test api  Operations wallet account ID', () => {
  let env = Env();
  let headers;
  let token;
  let wallet;
  _cy._time(60000);

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    wallet = await _cy.read_json('wallet_account', 'wallet_account_list');
  });

  it('UC001 - get list operations wallet account id', async () => {
    for (let account_id of wallet) {
      const response = await _cy.get_request(
        `${env.wallet_account}/${account_id.id}`,
        headers,
      );
      console.log(response);
      cy.wait(3000);
      // endpoint deveria retornar os dados da wallet por id.
    }
  });
});
