import { Env, Support as _cy } from '../../support/support';

describe('TC063 - Test api  Operations currency', () => {
  let env = Env();
  let headers;
  let token;
  _cy._time(60000);

  before(async () => {
    token = await _cy.headers('+5511912345678');
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - get operations permissions users', async () => {
    const response = await _cy.get_request(env.operations_permissions, headers);
    const array_validation = ['id', 'name', 'permission_types'];
    console.log(response);
    for (let validation of array_validation) {
      _cy.expect(response, validation);
      _cy.expect(response, 'id');
    }
  });
});
