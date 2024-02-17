import { Env, Support as _cy } from '../../support/support';

describe('TC038 - Test api  Wallets', () => {
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

  it('UC001 - get list all wallets', async () => {
    const response = await _cy.get_request(env.pix_payments_wallets, headers);
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

    file = response.body.data;
  });
  it('create json file', async () => {
    await _cy.write_json('wallets', 'list_wallets', file);
  });
});
