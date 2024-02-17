import { Env, Support as _cy } from '../../support/support';

describe('TC035 - Test api banks ted', () => {
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

  it('UC001 - Get list all banks ted', async () => {
    const response = await _cy.get_request(
      `${env.banks_ted}/banks?page=1&size=20&order=asc`,
      headers,
    );
    const array_list = [
      'id',
      'ispb',
      'name',
      'full_name',
      'created_at',
      'code',
    ];

    for (let path of response.body.data.data) {
      _cy.expect(path, array_list[0]);
      _cy.expect(path, array_list[1]);
      _cy.expect(path, array_list[2]);
      _cy.expect(path, array_list[3]);
      _cy.expect(path, array_list[4]);
      _cy.expect(path, array_list[5]);
    }
    file = response.body.data.data;
  });
  it('create json file', async () => {
    await _cy.write_json('banks', 'list_banks_ted', file);
  });
});
