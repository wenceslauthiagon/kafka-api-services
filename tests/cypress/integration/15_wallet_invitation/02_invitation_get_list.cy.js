import { Env, Support as _cy } from '../../support/support';

describe('TC054 - Test api  Operations wallet invitations', () => {
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

  it('UC001 - get list operations wallet invitation', async () => {
    const response = await _cy.get_request(
      `${env.wallet_invitation}/user?page=1&size=20&order=asc`,
      headers,
    );
    const array = response.body.data.data;
    for (let validation of array) {
      _cy.expect(validation, 'id');
      _cy.expect(validation, 'state');
      _cy.expect(validation, 'email');
      _cy.expect(validation, 'wallet_id');
      _cy.expect(validation, 'created_at');
      _cy.expect(validation, 'expired_at');
    }
    file = response.body.data.data;
  });

  it('create json file', async () => {
    await _cy.write_json('wallet_invitations', 'wallet_invitation_list', file);
  });
});
// precisamos entender como funciona os filtros dessa api
