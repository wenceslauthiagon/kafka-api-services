import { Env, Support as _cy } from '../../support/support';

describe('TC064 - Test api  Operations currency', () => {
  let env = Env();
  let headers;
  let file;
  let token;
  _cy._time(60000);

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - get permissions actions', async () => {
    const response = await _cy.get_request(
      env.operations_permissions_action,
      headers,
    );
    const array_validation = ['id', 'tag', 'name'];
    for (let validation of array_validation) {
      _cy.expect(response, validation);
    }

    file = response.body.data.data;
  });

  it('create json file', async () => {
    await _cy.write_json(
      'operations_permission',
      'list_operations_permission',
      file,
    );
  });
});
