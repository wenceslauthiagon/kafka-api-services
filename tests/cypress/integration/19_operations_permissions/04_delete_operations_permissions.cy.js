import { Env, Support as _cy } from '../../support/support';

describe('TC065 - Test api  Operations currency', () => {
  let env = Env();
  let headers;
  let token;
  _cy._time(60000);

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - delete operations by user id', async () => {
    const deleteEndpoint = `${env.delete_permissions}`;
    const response = await _cy.delete_request(deleteEndpoint, {}, headers);

    console.log(response.body);

    _cy.expect(response, 'success', true);
  });
});
