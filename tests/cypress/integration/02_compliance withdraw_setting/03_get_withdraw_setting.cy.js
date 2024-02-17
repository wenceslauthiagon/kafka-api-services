import { Env, Support as _cy } from '../../support/support';
const { v4: uuidv4 } = require('uuid');
describe('TC006 - Test - API Compliance Withdraw setting request - Get withdraw setting - ', () => {
  let env = Env();
  let token;
  let headers;
  let id;

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  before(async () => {
    await cy
      .readFile(
        '../tests/cypress/fixtures/compliance/id_create_wihtdrawal.json',
      )
      .then((data) => {
        id = data.id;
      });
  });
  _cy._time(60000);

  it('UC001 - user gets request for withdrawal settings by id', async () => {
    const response = await _cy.get_request(
      `${env.get_request_whithdrawal}/${id}`,
      headers,
    );
    _cy.expect(response, 'data');
    _cy.expect(response, 'id');
    _cy.expect(response, 'pix_key_type');
    _cy.expect(response, 'state');
    _cy.expect(response, 'wallet_id');
    _cy.expect(response, 'updated_at');
  });

  it('UC002 - user gets request for withdrawal settings by id invalid', async () => {
    const response = await _cy.get_request(
      `${env.get_request_whithdrawal}/${uuidv4()}`,
      headers,
    );
    _cy.expect(
      response,
      'message',
      'Não foi possível processar o seu pedido. Por favor tente novamente.',
    );
  });
});
