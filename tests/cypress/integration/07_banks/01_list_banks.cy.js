import { Env, Support as _cy } from '../../support/support';

describe('TC034 - Test api banks', () => {
  let env = Env();
  let headers;
  let token;
  let file;
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  _cy._time(60000);

  it('UC001 - Get list all banks', async () => {
    const response = await _cy.get_request(env.banks, headers);
    const array_list = ['id', 'ispb', 'name', 'full_name', 'created_at'];

    for (let path of array_list) {
      _cy.expect(response.body.data, path);
    }
    file = response.body.data.data;
  });
  it('create json file', async () => {
    await _cy.write_json('banks', 'list_banks', file);
  });
});
