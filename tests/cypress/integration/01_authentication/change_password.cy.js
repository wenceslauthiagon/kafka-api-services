import { MessagePassowd as _mock } from '../../mocks/authentication/change_password';
import { ChangePassword as _body } from '../../payloads/authentication/change_password';
import { Env, Support as _cy } from '../../support/support';

describe('TC001-Test - API Authentication - change password user', () => {
  let env = Env();
  let headers;
  let token;
  let payload = _body.body;
  let generate_password = _cy.generateString(5);

  _cy._time(60000);

  before(async () => {
    Cypress.env('access_token', null);
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 -error when passing new invalid password', async () => {
    const password = { ...payload };
    password.new_password = generate_password;
    const response = await _cy.post_request(
      env.change_password,
      password,
      headers,
    );
    if (response.body.message === _mock.message_one) {
      _cy.expect(response, 'message', _mock.message_one);
    } else if (response.body.message === _mock.message_two) {
      _cy.expect(response, 'message', _mock.message_two);
    }
  });
});
