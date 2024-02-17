import { RefreshToken as _body } from '../../mocks/authentication/refresh_token';
import { Env, Support as _cy } from '../../support/support';

describe('TC002 - Test - API Authentication - refresh token', () => {
  let env = Env();
  let headers;
  let token;

  _cy._time(60000);

  before(async () => {
    Cypress.env('access_token', null);
    Cypress.env('auth', null);
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token, 'access_token');
  });

  it('UC001 - validate new token', async () => {
    const response = await _cy.post_request(env.refresh_token, null, headers);
    _cy.expect(response, 'access_token');
  });

  it('UC002 - passing an invalid access', async () => {
    let access_token = { ...headers };
    access_token.access_token = _body.access_token;
    const response = await _cy.post_request(env.refresh_token, null, headers);
    _cy.expect(
      response,
      'message',
      'Acesso negado ao recurso solicitado. O usuário pode não ter permissão suficiente.',
    );
  });
});
